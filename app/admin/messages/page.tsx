'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Mail,
  Trash2,
  Clock,
  ExternalLink,
  RefreshCcw,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'New' | 'Read' | 'Replied';
  created_at: string;
}

export default function AdminMessagesPage() {
  const { email: adminEmail } = useAdmin();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'New' | 'Read' | 'Replied'>('all');

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
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen text-left">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Support Inbox</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage customer inquiries and technical support tickets.</p>
        </div>
        <Button onClick={fetchMessages} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all hover:shadow-lg">
            <RefreshCcw className="h-4 w-4 mr-2" /> Sync Inbox
        </Button>
      </header>

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

                      <div className="flex flex-col lg:flex-row justify-between gap-6 relative z-10">
                          <div className="space-y-4 flex-1">
                              <div className="flex items-center gap-4">
                                  <div className={cn(
                                      "h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-xs uppercase shadow-lg",
                                      msg.status === 'New' ? "bg-primary shadow-primary/20" : "bg-slate-400 shadow-slate-400/20"
                                  )}>
                                      {(msg.name || '??').substring(0, 2)}
                                  </div>
                                  <div>
                                      <h3 className="font-black text-foreground uppercase text-sm tracking-tight">{msg.name}</h3>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">{msg.email}</p>
                                  </div>
                                  <span className={cn(
                                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ml-auto lg:ml-4",
                                      msg.status === 'New' ? "bg-primary/10 text-primary" :
                                      msg.status === 'Read' ? "bg-primary/5 text-primary" :
                                      "bg-primary/5 text-primary"
                                  )}>
                                      {msg.status}
                                  </span>
                              </div>

                              <div className="pl-14">
                                  <p className="font-black text-foreground text-lg uppercase tracking-tight mb-2">{msg.subject}</p>
                                  <p className="text-slate-600 font-medium leading-relaxed max-w-3xl italic">&quot;{msg.message}&quot;</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-6 flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> Received {new Date(msg.created_at).toLocaleString()}
                                  </p>
                              </div>
                          </div>

                          <div className="lg:w-48 flex flex-col gap-2 pt-2">
                              <Button
                                onClick={() => window.open(`mailto:${msg.email}?subject=Re: ${msg.subject}`, '_blank')}
                                className="w-full rounded-xl h-12 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                              >
                                  <ExternalLink className="h-3 w-3 mr-2" /> Reply Email
                              </Button>

                              <div className="grid grid-cols-2 gap-2">
                                  {msg.status !== 'Read' && (
                                      <Button
                                        onClick={() => updateStatus(msg.id, 'Read')}
                                        variant="outline"
                                        className="rounded-xl h-10 font-black uppercase text-[8px] border-slate-100"
                                      >
                                          Mark Read
                                      </Button>
                                  )}
                                  {msg.status !== 'Replied' && (
                                      <Button
                                        onClick={() => updateStatus(msg.id, 'Replied')}
                                        variant="outline"
                                        className="rounded-xl h-10 font-black uppercase text-[8px] border-slate-100"
                                      >
                                          Done
                                      </Button>
                                  )}
                              </div>

                              <Button
                                onClick={() => deleteMessage(msg.id)}
                                variant="ghost"
                                className="w-full rounded-xl h-10 font-black uppercase text-[8px] text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                              >
                                  <Trash2 className="h-3 w-3 mr-2" /> Delete Ticket
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
