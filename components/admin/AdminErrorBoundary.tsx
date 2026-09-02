'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCcw, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

    // Auto-reload on ChunkLoadError (only once to avoid loops)
    const isChunkError = error.message.includes('Loading chunk') || error.name === 'ChunkLoadError';
    if (isChunkError) {
        const lastReload = sessionStorage.getItem('apex_last_chunk_reload');
        const now = Date.now();

        // If we haven't reloaded in the last 10 seconds, try it
        if (!lastReload || now - parseInt(lastReload) > 10000) {
            sessionStorage.setItem('apex_last_chunk_reload', now.toString());
            window.location.reload();
        }
    }
  }

  private handleReset = () => {
    // Clear potentially corrupted session cookies
    document.cookie = 'admin_session=; path=/; max-age=0';
    window.location.href = '/apex-portal';
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError = this.state.error?.message.includes('Loading chunk') || this.state.error?.name === 'ChunkLoadError';

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
          <div className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
            <div className={cn(
                "h-20 w-20 rounded-3xl flex items-center justify-center mb-8 shadow-sm",
                isChunkError ? "bg-primary/10 text-primary" : "bg-rose-50 text-rose-500"
            )}>
                {isChunkError ? <RefreshCcw className="h-10 w-10 animate-spin" /> : <ShieldAlert className="h-10 w-10" />}
            </div>

            <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-4 leading-none">
                {isChunkError ? 'Synchronizing with Cloud' : 'Admin Hub Encountered an Error'}
            </h1>
            <p className="text-slate-500 font-medium text-lg mb-8 italic leading-relaxed">
                {isChunkError
                    ? '"The Titan system detected a deployment update. We need to synchronize your local session with the grid, bro."'
                    : '"The Titan system detected a client-side exception. Your current session might be corrupted, bro."'
                }
            </p>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-10 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Technical Insight</p>
                <code className={cn(
                    "text-xs font-bold break-words block",
                    isChunkError ? "text-primary" : "text-rose-600"
                )}>
                    {this.state.error?.message || 'Unexpected application failure'}
                </code>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isChunkError ? (
                    <Button
                        onClick={() => window.location.reload()}
                        className="h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 sm:col-span-2"
                    >
                        <RefreshCcw className="h-4 w-4 mr-2" /> Hard Synchronize & Reload
                    </Button>
                ) : (
                    <>
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
                    </>
                )}
            </div>

            <button
                onClick={() => window.location.href = '/'}
                className="mt-8 w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-foreground transition-colors flex items-center justify-center gap-2"
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
