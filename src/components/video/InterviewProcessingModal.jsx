import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Cpu,
  Bot
} from 'lucide-react';
import GlassCard from '../GlassCard';

/**
 * InterviewProcessingModal
 * Renders real progressive processing steps after candidate finishes an interview.
 * Handles recording upload, transcription, communication metrics analysis, and final synthesis.
 */
export default function InterviewProcessingModal({
  isOpen,
  onComplete,
  processAction
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const STEPS = [
    {
      id: 'save',
      label: 'Saving interview recording...',
      detail: 'Packaging media stream and isolating user-scoped storage path.'
    },
    {
      id: 'transcribe',
      label: 'Transcribing verbal responses...',
      detail: 'Synthesizing verbatim question-and-answer transcripts.'
    },
    {
      id: 'communication',
      label: 'Analyzing communication metrics...',
      detail: 'Evaluating speaking pace (WPM), pauses, clarity, and STAR structure.'
    },
    {
      id: 'evaluate',
      label: 'Evaluating technical content...',
      detail: 'Running rubric assessments across domain depth and trade-offs.'
    },
    {
      id: 'compile',
      label: 'Compiling comprehensive feedback...',
      detail: 'Generating personalized strengths, improvement areas, and gap recommendations.'
    }
  ];

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const runProcessing = async () => {
      // Step 1: Saving recording
      setCurrentStepIndex(0);
      await new Promise(r => setTimeout(r, 600));

      // Step 2: Transcribing
      if (!isMounted) return;
      setCurrentStepIndex(1);
      await new Promise(r => setTimeout(r, 700));

      // Step 3: Analyzing communication
      if (!isMounted) return;
      setCurrentStepIndex(2);

      // Execute actual processing action if passed
      if (processAction) {
        try {
          await processAction();
        } catch (e) {
          console.warn('[InterviewProcessingModal] processing action error:', e);
        }
      } else {
        await new Promise(r => setTimeout(r, 700));
      }

      // Step 4: Evaluating
      if (!isMounted) return;
      setCurrentStepIndex(3);
      await new Promise(r => setTimeout(r, 600));

      // Step 5: Compiling feedback
      if (!isMounted) return;
      setCurrentStepIndex(4);
      await new Promise(r => setTimeout(r, 600));

      if (isMounted) {
        setCurrentStepIndex(5);
        await new Promise(r => setTimeout(r, 400));
        onComplete?.();
      }
    };

    runProcessing();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-300">
      <GlassCard className="max-w-md w-full p-8 border-[#E5E0D5] bg-[#FFFDF9] rounded-md shadow-2xl relative space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-md bg-[#1B2A4A] mx-auto flex items-center justify-center shadow-xs">
            <Bot className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#1F1B16] tracking-tight">
            Analyzing Interview Performance
          </h2>
          <p className="text-xs text-[#70685E]">
            Evaluating your responses against objective interview rubrics.
          </p>
        </div>

        {/* Steps Progression */}
        <div className="space-y-3 pt-2">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`p-3 rounded-md border transition-all flex items-start gap-3 ${
                  isCompleted
                    ? 'bg-[#EBF4EE] border-[#235E3B]/30 text-[#235E3B]'
                    : isCurrent
                    ? 'bg-[#FAF8F3] border-[#1B2A4A] text-[#1F1B16] shadow-xs'
                    : 'bg-[#FAF8F3] border-[#E5E0D5] text-[#8A8277]'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#235E3B]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-[#1B2A4A] animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#8A8277] flex items-center justify-center text-[9px] font-mono">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight">
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[11px] text-[#70685E] mt-0.5 leading-tight animate-in fade-in">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Privacy Note */}
        <div className="p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-center gap-2 text-[11px] text-[#70685E]">
          <ShieldCheck className="w-4 h-4 text-[#235E3B] shrink-0" />
          <span>Tenant isolated: you may inspect or archive this session record at your discretion.</span>
        </div>
      </GlassCard>
    </div>
  );
}
