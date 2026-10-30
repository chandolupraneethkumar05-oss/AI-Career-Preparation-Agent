/**
 * Peer-to-Peer Collaborative Video Chamber Service
 * AI Career Preparation Agent
 *
 * Implements native browser WebRTC RTCPeerConnection streaming using free Google & Twilio STUN,
 * resilient WebSocket signaling to the FastAPI gateway, local media track controls,
 * and live AI Proctor events. Zero paid API dependencies ($0.00 cost).
 */

import { getWebSocketUrl } from './apiConfig';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:standard.relay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:standard.relay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:standard.relay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

export class PeerRoomService {
  constructor() {
    this.ws = null;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.screenStream = null;
    this.roomId = null;
    this.role = null;
    this.userName = null;
    this.userId = null;
    this.clientId = `client_${Math.random().toString(36).substring(2, 9)}`;
    this.callbacks = {};
    this.isInitiator = false;
    this.iceCandidateQueue = [];
    this.hasRemoteDescription = false;
  }

  /**
   * Initializes the WebSocket signaling channel and binds event handlers.
   */
  async connect(roomId, role, userName, userId, callbacks = {}) {
    this.roomId = (roomId || '').toUpperCase().trim();
    this.role = role || 'candidate';
    this.userName = userName || (role === 'interviewer' ? 'Interviewer' : 'Candidate');
    this.userId = userId || this.clientId;
    this.callbacks = callbacks;

    const wsUrl = getWebSocketUrl(`/ws/peer-room/${this.roomId}`);

    return new Promise((resolve, reject) => {
      try {
        if (this.ws) {
          try { this.ws.close(); } catch {}
        }

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this._emit('status', { state: 'ws_connected', message: 'Connected to signaling hub' });
          this.ws.send(JSON.stringify({
            type: 'join',
            role: this.role,
            userName: this.userName,
            userId: this.userId,
            clientId: this.clientId
          }));
          resolve(true);
        };

        this.ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            await this._handleSignalingMessage(data);
          } catch (err) {
            console.error('[PeerRoomService] Message parse error:', err);
          }
        };

        this.ws.onerror = (err) => {
          console.error('[PeerRoomService] WebSocket error:', err);
          this._emit('error', { type: 'ws_error', error: err });
          reject(err);
        };

        this.ws.onclose = () => {
          this._emit('status', { state: 'ws_closed', message: 'Signaling connection closed' });
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Captures local camera and microphone stream.
   */
  async startMedia(video = true, audio = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false
      });

      // If peer connection already instantiated, attach tracks immediately
      if (this.peerConnection) {
        this._attachLocalTracks(this.peerConnection);
      }

      this._emit('localStream', this.localStream);

      // Signal ready state to signaling hub
      this._send({ type: 'peer_ready', clientId: this.clientId });

      return this.localStream;
    } catch (err) {
      console.warn('[PeerRoomService] Camera/Mic capture error, falling back to audio only or mute:', err);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (this.peerConnection) {
          this._attachLocalTracks(this.peerConnection);
        }
        this._emit('localStream', this.localStream);
        this._send({ type: 'peer_ready', clientId: this.clientId });
        return this.localStream;
      } catch (fallbackErr) {
        this._emit('error', { type: 'media_error', error: fallbackErr });
        return null;
      }
    }
  }

  /**
   * Attaches local audio and video tracks to the peer connection safely without duplicates.
   */
  _attachLocalTracks(pc) {
    if (!this.localStream || !pc) return;
    const senders = pc.getSenders();
    this.localStream.getTracks().forEach((track) => {
      const alreadyAdded = senders.some((s) => s.track && s.track.id === track.id);
      if (!alreadyAdded) {
        pc.addTrack(track, this.localStream);
      }
    });
  }

  /**
   * Initializes or returns the WebRTC RTCPeerConnection instance.
   */
  _ensurePeerConnection() {
    if (this.peerConnection) {
      this._attachLocalTracks(this.peerConnection);
      return this.peerConnection;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnection = pc;

    // Attach local tracks
    this._attachLocalTracks(pc);

    // Remote stream arrives
    pc.ontrack = (event) => {
      const bindTrackEvents = (track) => {
        track.onunmute = () => {
          this._emit('remoteStream', this.remoteStream);
          this._emit('trackResumed', { kind: track.kind });
        };
        track.onmute = () => {
          this._emit('trackMuted', { kind: track.kind });
        };
      };

      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.remoteStream.getTracks().forEach(bindTrackEvents);
        this._emit('remoteStream', this.remoteStream);
      } else if (event.track) {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        this.remoteStream.addTrack(event.track);
        bindTrackEvents(event.track);
        this._emit('remoteStream', this.remoteStream);
      }
    };

    // ICE Candidate discovered locally -> relay via WebSocket to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
        const candidatePayload = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
        this.ws.send(JSON.stringify({
          type: 'signal_ice',
          candidate: candidatePayload
        }));
      }
    };

    pc.oniceconnectionstatechange = () => {
      this._emit('iceState', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        this._emit('connectionState', 'connected');
      }
    };

    pc.onconnectionstatechange = () => {
      this._emit('connectionState', pc.connectionState);
      if (pc.connectionState === 'failed') {
        // Attempt ICE restart
        this._restartIce();
      }
    };

    return pc;
  }

  /**
   * Restarts ICE negotiation on connection drops.
   */
  async _restartIce() {
    if (!this.peerConnection || !this.isInitiator) return;
    try {
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);
      this._send({ type: 'signal_offer', sdp: offer });
    } catch (err) {
      console.warn('[PeerRoomService] ICE restart notice:', err);
    }
  }

  /**
   * Creates an SDP offer and sends it to the remote peer.
   */
  async _createAndSendOffer() {
    try {
      const pc = this._ensurePeerConnection();
      this._attachLocalTracks(pc);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'signal_offer',
          sdp: offer
        }));
      }
    } catch (err) {
      console.error('[PeerRoomService] Error creating SDP offer:', err);
    }
  }

  /**
   * Handles incoming signaling messages from FastAPI backend.
   */
  async _handleSignalingMessage(data) {
    const pc = this._ensurePeerConnection();

    switch (data.type) {
      case 'joined':
        this.role = data.role;
        this._emit('joined', data);
        break;

      case 'peer_joined':
        this._emit('peerJoined', data);
        break;

      case 'peer_ready':
        // Second peer is ready, initiate offer
        this.isInitiator = true;
        await this._createAndSendOffer();
        break;

      case 'peer_left':
        this._emit('peerLeft', data);
        if (this.remoteStream) {
          this.remoteStream = null;
          this._emit('remoteStream', null);
        }
        break;

      case 'initiate_offer':
        this.isInitiator = true;
        await this._createAndSendOffer();
        break;

      case 'signal_offer':
        try {
          this._attachLocalTracks(pc);
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          this.hasRemoteDescription = true;

          // Drain queued candidates
          while (this.iceCandidateQueue.length > 0) {
            const cand = this.iceCandidateQueue.shift();
            try {
              await pc.addIceCandidate(cand);
            } catch {}
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              type: 'signal_answer',
              sdp: answer
            }));
          }
        } catch (err) {
          console.error('[PeerRoomService] Error handling offer:', err);
        }
        break;

      case 'signal_answer':
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          this.hasRemoteDescription = true;

          while (this.iceCandidateQueue.length > 0) {
            const cand = this.iceCandidateQueue.shift();
            try {
              await pc.addIceCandidate(cand);
            } catch {}
          }
        } catch (err) {
          console.error('[PeerRoomService] Error handling answer:', err);
        }
        break;

      case 'signal_ice':
        try {
          if (data.candidate) {
            const candidate = new RTCIceCandidate(data.candidate);
            if (this.hasRemoteDescription && pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(candidate);
            } else {
              this.iceCandidateQueue.push(candidate);
            }
          }
        } catch (err) {
          console.warn('[PeerRoomService] ICE candidate parse notice:', err);
        }
        break;

      case 'media_state':
        this._emit('peerMediaState', data);
        break;

      case 'code_sync':
        this._emit('codeSync', data.code);
        break;

      case 'ai_question_suggested':
        this._emit('aiQuestionSuggested', data.question);
        break;

      case 'active_question':
        this._emit('activeQuestion', data);
        break;

      case 'transcript_update':
        this._emit('transcriptUpdate', data.utterance);
        break;

      case 'ai_copilot_hint':
        this._emit('aiCopilotHint', data.hint);
        break;

      case 'session_start':
        this._emit('sessionStart', data);
        break;

      case 'role_swapped':
        this.role = data.yourNewRole;
        this._emit('roleSwapped', data);
        break;

      case 'role_updated':
        this.role = data.role;
        this._emit('roleUpdated', data);
        break;

      case 'peer_role_updated':
        this._emit('peerRoleUpdated', data);
        break;

      case 'peer_interim_speech':
        this._emit('peerInterimSpeech', data);
        break;

      case 'note_saved':
        this._emit('noteSaved', data);
        break;

      case 'session_concluded':
        this._emit('sessionConcluded', data.report);
        break;

      default:
        break;
    }
  }

  // =========================================================================
  // Client Action Triggers
  // =========================================================================

  setRole(targetRole) {
    if (!targetRole || this.role === targetRole) return;
    this._send({ type: 'set_role', role: targetRole });
  }

  swapRoles() {
    this._send({ type: 'role_swap' });
  }

  sendInterimSpeech(text) {
    if (!text || !text.trim()) return;
    this._send({ type: 'interim_speech', text: text.trim() });
  }

  requestAiQuestion() {
    this._send({ type: 'request_ai_question' });
  }

  pushQuestionToCandidate() {
    this._send({ type: 'push_question_to_candidate' });
  }

  sendTranscriptUtterance(text) {
    if (!text || !text.trim()) return;
    this._send({
      type: 'transcript_utterance',
      text: text.trim(),
      speaker: this.role
    });
  }

  sendCodeSync(code) {
    this._send({ type: 'code_sync', code });
  }

  submitNote(note, rating = 4) {
    this._send({ type: 'submit_note', note, rating });
  }

  concludeSession() {
    this._send({ type: 'conclude_session' });
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => {
        t.enabled = enabled;
      });
      this._send({ type: 'media_state', audio: enabled });
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((t) => {
        t.enabled = enabled;
      });
      this._send({ type: 'media_state', video: enabled });
    }
  }

  async toggleScreenShare() {
    if (this.screenStream) {
      // Revert to camera
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
      if (this.localStream && this.peerConnection) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }
      this._emit('localStream', this.localStream);
      return false;
    } else {
      // Start screen share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        this.screenStream = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        if (this.peerConnection) {
          const sender = this.peerConnection.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            await sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          this.toggleScreenShare();
        };

        this._emit('localStream', screenStream);
        return true;
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
        return false;
      }
    }
  }

  _send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  _emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  disconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    this.remoteStream = null;
    this.iceCandidateQueue = [];
    this.hasRemoteDescription = false;
  }
}

export const peerRoomService = new PeerRoomService();
