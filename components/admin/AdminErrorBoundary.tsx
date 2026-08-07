'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCcw, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin Hub Crash:', error, errorInfo);
  }

  private handleReset = () => {
    // Clear potentially corrupted session cookies
    document.cookie = 'admin_session=; path=/; max-age=0';
    window.location.href = '/admin/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-500 mb-8 shadow-sm">
                <ShieldAlert className="h-10 w-10" />
            </div>

            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none">
                Admin Hub Encountered an Error
            </h1>
            <p className="text-slate-500 font-medium text-lg mb-8 italic leading-relaxed">
                &quot;The Titan system detected a client-side exception. Your current session might be corrupted, bro.&quot;
            </p>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-10 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Technical Insight</p>
                <code className="text-xs font-bold text-rose-600 break-words block">
                    {this.state.error?.message || 'Unexpected application failure'}
                </code>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                    onClick={this.handleReset}
                    className="h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"
                >
                    <LogOut className="h-4 w-4 mr-2" /> Reset Session & Logout
                </Button>
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="h-16 rounded-2xl border-2 border-slate-100 font-black uppercase text-xs tracking-widest hover:bg-slate-50"
                >
                    <RefreshCcw className="h-4 w-4 mr-2" /> Retry Page
                </Button>
            </div>

            <button
                onClick={() => window.location.href = '/'}
                className="mt-8 w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
            >
                <Home className="h-3 w-3" /> Return to Public Store
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
