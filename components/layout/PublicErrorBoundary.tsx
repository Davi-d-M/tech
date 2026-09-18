'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class PublicErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Public Hub Crash:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-8 animate-in zoom-in-95 duration-500">
            <div className="h-20 w-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert className="h-10 w-10" />
            </div>

            <div className="space-y-3">
                <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter leading-none">
                    Module <span className="text-primary">Conflict</span>
                </h1>
                <p className="text-slate-500 font-medium text-sm italic leading-relaxed">
                    The OS detected a client-side exception. We need to re-initialize your session to restore stability.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
                    <code className="text-[10px] text-rose-500 font-bold break-words block">
                        {this.state.error?.message || "Unexpected failure"}
                    </code>
                </div>
            </div>

            <div className="pt-4 space-y-4">
                <Button
                    onClick={() => window.location.reload()}
                    className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <RefreshCcw className="h-4 w-4 mr-2" /> Re-Initialize Session
                </Button>

                <button
                    onClick={() => {
                        // Clear non-critical state
                        try {
                            sessionStorage.clear();
                            window.location.href = '/';
                        } catch (e) {
                            window.location.reload();
                        }
                    }}
                    className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 hover:text-foreground transition-colors flex items-center justify-center gap-2 w-full"
                >
                    <Home className="h-3 w-3" /> Factory Reset & Home
                </button>
            </div>

            <p className="text-[8px] font-black text-slate-200 uppercase tracking-[0.6em] pt-8">
                Apex OS Resilience Protocol v2
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
