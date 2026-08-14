'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Mail,
  Trash2,
  Clock,
  ExternalLink,
  RefreshCcw,
  Search,
  Zap,
  Send,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

interface Message {
  id: number;
  user_id?: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'New' | 'Read' | 'Replied';
  admin_response?: string | null;
  created_at: string;
}

export default function AdminMessagesPage() {
  const { email: adminEmail } = useAdmin();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'New' | 'Read' | 'Replied'>('all');

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSavingReply, setIsSavingResponse] = useState(false);
  const [toast, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchMessages = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const updateStatus = async (id: number, status: 'Read' | 'Replied') => {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('messages').update({ status }).eq('id', id);
        if (error) throw error;

        await logAuditAction(adminEmail, 'UPDATE_MESSAGE_STATUS', { id, status });
        setMessages(messages.map(m => m.id === id ? { ...m, status } : m));
    } catch (err) {
        console.error(err);
    }
  };

  const handleSaveReply = async (id: number) => {
    if (!supabase || !replyText.trim()) return;
    setIsSavingResponse(true);
    try {
        const { error } = await supabase
            .from('messages')
            .update({
                admin_response: replyText.trim(),
                status: 'Replied'
            })
            .eq('id', id);

        if (error) throw error;

        await logAuditAction(adminEmail, 'REPLY_TO_SUPPORT_TICKET', { id });
        setMessages(messages.map(m => m.id === id ? { ...m, admin_response: replyText.trim(), status: 'Replied' } : m));
        setReplyingTo(null);
        setReplyText('');
        setStatus({ type: 'success', text: "Official Response Transmitted. ✅" });
        setTimeout(() => setStatus(null), 3000);
    } catch (err: unknown) {
        setStatus({ type: 'error', text: (err as Error).message });
    } finally {
        setIsSavingResponse(false);
    }
  };

  const deleteMessage = async (id: number) => {
      if (!supabase) return;
      try {
          const { error } = await supabase.from('messages').delete().eq('id', id);
          if (error) throw error;

          await logAuditAction(adminEmail, 'DELETE_MESSAGE', { id });
          setMessages(messages.filter(m => m.id !== id));
      } catch (err) {
          console.error(err);
      }
  };

  const filteredMessages = messages.filter(m => {
      const query = (searchQuery || '').toLowerCase();
      const matchesSearch = (m.name || '').toLowerCase().includes(query) ||
                            (m.email || '').toLowerCase().includes(query) ||
                            (m.subject || '').toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || m.status === filter;
      return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left pb-40">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Support Inbox</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage customer inquiries and technical support tickets.</p>
        </div>
        <Button onClick={fetchMessages} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all hover:shadow-lg">
            <RefreshCcw className="h-4 w-4 mr-2" /> Sync Inbox
        </Button>
      </header>

      {toast && (
          <div className={cn(
              "p-4 rounded-[1.5rem] border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
              toast.type === 'success' ? "bg-primary/10 border-primary/20 text-primary" : "bg-rose-50 border-rose-100 text-rose-600"
          )}>
              <Zap className="h-5 w-5" />
              <p className="text-xs font-black uppercase tracking-widest">{toast.text}</p>
          </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, email or keyword..."
                className="h-14 rounded-2xl border-slate-100 bg-white pl-12 text-sm font-medium shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
          </div>
          <div className="flex gap-2">
              {(['all', 'New', 'Read', 'Replied'] as const).map(f => (
                  <Button
                    key={f}
                    onClick={() => setFilter(f)}
                    variant={filter === f ? 'default' : 'outline'}
                    className={cn(
                        "rounded-xl h-14 px-6 font-black uppercase text-[10px] tracking-widest transition-all shadow-sm active:scale-95",
                        filter === f ? "bg-primary text-white shadow-primary/20" : "bg-white border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20"
                    )}
                  >
                      {f}
                  </Button>
              ))}
          </div>
      </div>

      {loading ? (
          <div className="p-32 text-center flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Accessing Secure Comms...</p>
          </div>
      ) : filteredMessages.length === 0 ? (
          <div className="p-32 text-center flex flex-col items-center gap-6 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-100"><Mail className="h-10 w-10" /></div>
              <p className="text-lg font-black text-slate-300 uppercase tracking-tight italic">Your inbox is clean, bro.</p>
          </div>
      ) : (
          <div className="grid gap-6">
              {filteredMessages.map(msg => (
                  <div key={msg.id} className={cn(
                      "bg-white rounded-[2.5rem] border p-8 shadow-sm transition-all hover:shadow-xl group relative overflow-hidden",
                      msg.status === 'New' ? "border-primary/20 bg-primary/[0.01]" : "border-slate-100"
                  )}>
                      {msg.status === 'New' && <div className="absolute top-0 left-0 h-full w-1.5 bg-primary"></div>}

                      <div className="flex flex-col lg:flex-row justify-between gap-10 relative z-10">
                          <div className="space-y-6 flex-1">
                              <div className="flex items-center gap-4">
                                  <div className={cn(
                                      "h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-xs uppercase shadow-lg",
                                      msg.status === 'New' ? "bg-primary shadow-primary/20" : "bg-slate-400 shadow-slate-400/20"
                                  )}>
                                      {(msg.name || '??').substring(0, 2)}
                                  </div>
                                  <div>
                                      <h3 className="font-black text-foreground uppercase text-sm tracking-tight">{msg.name}</h3>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">{msg.email}</p>
                                  </div>
                                  <div className="ml-auto flex items-center gap-3">
                                    {msg.user_id && (
                                        <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase border border-indigo-100">Verified Member</span>
                                    )}
                                    <span className={cn(
                                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                        msg.status === 'New' ? "bg-primary/10 text-primary" :
                                        msg.status === 'Read' ? "bg-slate-100 text-slate-500" :
                                        "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    )}>
                                        {msg.status}
                                    </span>
                                  </div>
                              </div>

                              <div className="pl-16 space-y-4">
                                  <div>
                                    <p className="font-black text-foreground text-lg uppercase tracking-tight mb-2">{msg.subject}</p>
                                    <p className="text-slate-600 font-medium leading-relaxed max-w-3xl italic">&quot;{msg.message}&quot;</p>
                                  </div>

                                  {msg.admin_response && replyingTo !== msg.id && (
                                      <div className="bg-slate-50 rounded-2xl p-6 border-l-4 border-primary mt-4 relative overflow-hidden group/reply">
                                          <p className="text-[9px] font-black uppercase text-primary mb-2 flex items-center gap-2">
                                              <Zap size={10} className="fill-current" /> Official Apex Response
                                          </p>
                                          <p className="text-sm font-bold text-slate-700 italic leading-relaxed">&quot;{msg.admin_response}&quot;</p>
                                          <button
                                            onClick={() => { setReplyingTo(msg.id); setReplyText(msg.admin_response || ''); }}
                                            className="absolute top-4 right-4 text-[8px] font-black uppercase text-slate-400 hover:text-primary opacity-0 group-hover/reply:opacity-100 transition-all"
                                          >
                                              Edit
                                          </button>
                                      </div>
                                  )}

                                  {replyingTo === msg.id && (
                                      <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                          <Textarea
                                            autoFocus
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="Establish tactical response..."
                                            className="min-h-[120px] rounded-[1.5rem] border-slate-200 bg-white text-sm font-medium resize-none p-5 shadow-inner"
                                          />
                                          <div className="flex gap-2">
                                              <Button
                                                onClick={() => handleSaveReply(msg.id)}
                                                disabled={isSavingReply}
                                                className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 active:scale-95"
                                              >
                                                  {isSavingReply ? <Loader2 size={16} className="animate-spin" /> : 'Transmit Response'}
                                              </Button>
                                              <Button onClick={() => setReplyingTo(null)} variant="outline" className="h-12 px-6 rounded-xl font-black uppercase text-[10px] border-slate-100">Cancel</Button>
                                          </div>
                                      </div>
                                  )}

                                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-6 flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> Received {new Date(msg.created_at).toLocaleString()}
                                  </p>
                              </div>
                          </div>

                          <div className="lg:w-48 flex flex-col gap-2 pt-2">
                              {!msg.admin_response && replyingTo !== msg.id && (
                                  <Button
                                    onClick={() => { setReplyingTo(msg.id); setReplyText(''); }}
                                    className="w-full rounded-xl h-12 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                                  >
                                      <Send className="h-3 w-3 mr-2" /> Direct Reply
                                  </Button>
                              )}

                              <Button
                                onClick={() => window.open(`mailto:${msg.email}?subject=Re: ${msg.subject}`, '_blank')}
                                variant="outline"
                                className="w-full rounded-xl h-12 font-black uppercase text-[10px] tracking-widest border-slate-100 hover:bg-slate-50 transition-all"
                              >
                                  <ExternalLink className="h-3 w-3 mr-2" /> External Email
                              </Button>

                              {msg.status === 'New' && (
                                  <Button
                                    onClick={() => updateStatus(msg.id, 'Read')}
                                    variant="ghost"
                                    className="rounded-xl h-10 font-black uppercase text-[8px] text-slate-400 hover:text-primary"
                                  >
                                      Mark as Read
                                  </Button>
                              )}

                              <Button
                                onClick={() => deleteMessage(msg.id)}
                                variant="ghost"
                                className="w-full rounded-xl h-10 font-black uppercase text-[8px] text-slate-200 hover:text-rose-600 hover:bg-rose-50"
                              >
                                  <Trash2 className="h-3 w-3 mr-2" /> Expel Ticket
                              </Button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
