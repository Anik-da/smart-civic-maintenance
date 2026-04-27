import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("App Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="glass p-12 rounded-[2rem] border-rose/20 max-w-lg">
            <AlertTriangle className="w-16 h-16 text-rose mx-auto mb-6 animate-pulse" />
            <h1 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">System Interface Error</h1>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              We encountered a critical visualization error. This usually happens due to temporary network issues or secure cloud synchronization failures.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="glass glass-btn glass-btn--primary w-full h-14 flex items-center justify-center gap-3"
            >
              <RefreshCw className="w-4 h-4" /> REBOOT INTERFACE
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
