import React from 'react';
import GlassCard from './GlassCard';
import GradientButton from './GradientButton';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-[#F8F6F0]">
          <GlassCard className="max-w-md w-full p-8 border-[#E5E0D5] bg-[#FFFDF9] rounded-md text-center space-y-5">
            <div className="w-12 h-12 mx-auto rounded-md bg-[#FDF2E9] border border-[#9A421A]/30 flex items-center justify-center text-[#9A421A]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1F1B16]">Something Went Wrong</h2>
              <p className="text-xs text-[#70685E] mt-1.5 leading-relaxed">
                An unexpected issue occurred while loading this page. Your saved interviews and progress records are safe.
              </p>
              {this.state.error && (
                <details className="mt-3 text-left bg-[#FAF8F3] border border-[#E5E0D5] rounded-md p-2 text-[11px] text-[#9A421A] font-mono">
                  <summary className="cursor-pointer text-[#70685E] hover:text-[#1F1B16] select-none">
                    View error details
                  </summary>
                  <p className="mt-1.5 break-words whitespace-pre-wrap">{this.state.error.toString()}</p>
                </details>
              )}
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <GradientButton
                variant="primary"
                size="sm"
                icon={RefreshCw}
                onClick={this.handleReset}
              >
                Reload Page
              </GradientButton>
              <GradientButton
                variant="secondary"
                size="sm"
                icon={Home}
                onClick={() => (window.location.href = '/dashboard')}
              >
                Dashboard
              </GradientButton>
            </div>
          </GlassCard>
        </div>
      );
    }
    return this.props.children;
  }
}
