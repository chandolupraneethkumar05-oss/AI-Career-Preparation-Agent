/**
 * Peer-to-Peer Collaborative Video Chamber Service
 * AI Career Preparation Agent
 *
 * Implements native browser WebRTC RTCPeerConnection streaming using free Google STUN,
 * resilient WebSocket signaling to the FastAPI gateway, local media track controls,
 * and live AI Proctor events. Zero paid API dependencies ($0.00 cost).
 */

import { getWebSocketUrl } from './apiConfig';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
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
    this.callbacks = {};
    this.isInitiator = false;
    this.iceCandidateQueue = [];
  }

  /**
   * Initializes the WebSocket signaling channel and binds event handlers.
   */
  async connect(roomId, role, userName, userId, callbacks = {}) {
    this.roomId = roomId;
    this.role = role || 'candidate';
    this.userName = userName || (role === 'interviewer' ? 'Interviewer' : 'Candidate');
    this.userId = userId || `usr_${Math.random().toString(36).substring(2, 9)}`;
    this.callbacks = callbacks;

    // Build WebSocket URL
    // In local dev, getWebSocketUrl('/ws/peer-room/' + roomId) proxies through Vite to 127.0.0.1:8000
    const wsUrl = getWebSocketUrl(`/ws/peer-room/${roomId}`);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this._emit('status', { state: 'ws_connected', message: 'Connected to signaling hub' });
          this.ws.send(JSON.stringify({
            type: 'join',
            role: this.role,
            userName: this.userName,
            userId: this.userId
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
      this._emit('localStream', this.localStream);
      return this.localStream;
    } catch (err) {
      console.warn('[PeerRoomService] Media device capture error, falling back to audio-only or mute:', err);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this._emit('localStream', this.localStream);
        return this.localStream;
      } catch (fallbackErr) {
        this._emit('error', { type: 'media_error', error: fallbackErr });
        return null;
      }
    }
  }

  /**
   * Initializes or gets the WebRTC RTCPeerConnection instance.
   */
  _ensurePeerConnection() {
    if (this.peerConnection) return this.peerConnection;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnection = pc;

    // Attach local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Remote track arrived
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this._emit('remoteStream', this.remoteStream);
      }
    };

    // ICE Candidate discovered locally -> relay via WebSocket to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'signal_ice',
          candidate: event.candidate
        }));
      }
    };

    pc.oniceconnectionstatechange = () => {
      this._emit('iceState', pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      this._emit('connectionState', pc.connectionState);
    };

    return pc;
  }

  /**
   * Creates an SDP offer and sends it to the remote peer.
   */
  async _createAndSendOffer() {
    try {
      const pc = this._ensurePeerConnection();
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
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          // Drain any queued ICE candidates
          while (this.iceCandidateQueue.length > 0) {
            const cand = this.iceCandidateQueue.shift();
            await pc.addIceCandidate(cand);
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
          while (this.iceCandidateQueue.length > 0) {
            const cand = this.iceCandidateQueue.shift();
            await pc.addIceCandidate(cand);
          }
        } catch (err) {
          console.error('[PeerRoomService] Error handling answer:', err);
        }
        break;

      case 'signal_ice':
        try {
          if (data.candidate) {
            const candidate = new RTCIceCandidate(data.candidate);
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(candidate);
            } else {
              this.iceCandidateQueue.push(candidate);
            }
          }
        } catch (err) {
          console.error('[PeerRoomService] Error adding ICE candidate:', err);
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
      this.ws.close();
      this.ws = null;
    }
    this.remoteStream = null;
    this.iceCandidateQueue = [];
  }
}

export const peerRoomService = new PeerRoomService();
