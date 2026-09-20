import React, { useState } from 'react';
import { X, MessageSquare, Star, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { feedbackApi } from '../services/feedbackApi';
import { useAuth } from '../context/AuthContext';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';

export default function FeedbackModal({ isOpen, onClose, defaultContext = '' }) {
  const { user } = useAuth();
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim().length < 3) {
      setErrorMessage('Please type at least 3 characters to submit feedback.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await feedbackApi.submitFeedback(
        {
          category,
          message: message.trim(),
          rating,
          page_context: defaultContext || window.location.pathname
        },
        user?.id || 'user-001'
      );
      setSuccessMessage('Thank you! Your feedback has been received and will help improve the platform.');
      setTimeout(() => {
        setSuccessMessage('');
        setMessage('');
        onClose();
      }, 1600);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg">
        <GlassCard className="p-6 bg-[#FFFDF9] border-[#E5E0D5] shadow-lg relative space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-[#1B2A4A] flex items-center justify-center text-white shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-[#1F1B16]">Product Feedback</h3>
                <p className="text-[11px] text-[#70685E]">Share suggestions, bug reports, or evaluation thoughts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#70685E] hover:text-[#1F1B16] hover:bg-[#FAF8F3] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {successMessage ? (
            <div className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#EBF4EE] border border-[#235E3B]/30 flex items-center justify-center mx-auto text-[#235E3B]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-serif font-bold text-[#1F1B16]">{successMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-2.5 rounded-md bg-[#FDF2F2] border border-[#E0A8A8] text-xs text-[#9A2A2A]">
                  {errorMessage}
                </div>
              )}

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#70685E] mb-1.5">Feedback Topic</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs text-[#1F1B16] focus:outline-none focus:border-[#1A365D]"
                >
                  <option value="general">General Suggestion</option>
                  <option value="bug">Bug or Technical Issue</option>
                  <option value="interview_flow">Interview Questions & Practice</option>
                  <option value="scoring">Score & Evaluation Accuracy</option>
                  <option value="feature_request">Feature Request / Idea</option>
                  <option value="ui_ux">Design & User Experience</option>
                </select>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-xs font-semibold text-[#70685E] mb-1.5">Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-[#8C6E54] hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${star <= rating ? 'fill-[#8C6E54] text-[#8C6E54]' : 'text-[#D0C8B8]'}`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-[#70685E] ml-2 font-mono">{rating} / 5</span>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#70685E]">Your Feedback</label>
                  <div className="text-[11px] font-mono text-[#70685E] flex items-center gap-2">
                    {message.length > 0 && message.trim().length < 3 && (
                      <span className="text-[#9A421A] font-sans font-semibold">Min 3 characters</span>
                    )}
                    <span>{message.length}/2000</span>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  placeholder="Describe your feedback, bug report, or feature suggestion clearly..."
                  className="w-full p-3 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] text-xs text-[#1F1B16] focus:outline-none focus:border-[#1A365D] placeholder:text-[#A0988E]"
                  required
                />
              </div>

              {/* Privacy Notice */}
              <div className="p-2.5 rounded-md bg-[#FAF8F3] border border-[#E5E0D5] flex items-start gap-2 text-[11px] text-[#70685E]">
                <ShieldAlert className="w-4 h-4 text-[#8C6E54] shrink-0 mt-0.5" />
                <span>Privacy Notice: Please avoid sharing passwords, sensitive tokens, or private confidential information.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E0D5]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#70685E] hover:text-[#1F1B16] transition-colors"
                >
                  Cancel
                </button>
                <GradientButton
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmitting || message.trim().length < 3}
                  loading={isSubmitting}
                  icon={Send}
                >
                  Submit Feedback
                </GradientButton>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
