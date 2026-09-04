'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus,
    CheckCircle2,
    RefreshCcw,
    ChevronRight,
    Zap,
    Layout,
    MoreVertical,
    AlertCircle,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'Todo' | 'InProgress' | 'Review' | 'Done';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    assigned_to: string | null;
    due_date: string | null;
    created_at: string;
}

export default function TaskCenter() {
    const { email: adminEmail } = useAdmin();
    const [tasks, setTasks] = React.useState<Task[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isAdding, setIsAdding] = React.useState(false);
    const [newTask, setNewTask] = React.useState({ title: '', description: '', priority: 'Medium' as Task['priority'] });
    const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchTasks = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('admin_tasks').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setTasks(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleCreateTask = async () => {
        if (!supabase || !newTask.title.trim()) return;
        try {
            const { error } = await supabase.from('admin_tasks').insert([{
                title: newTask.title,
                description: newTask.description,
                status: 'Todo',
                priority: newTask.priority,
                assigned_to: 'Staff',
                created_by: adminEmail
            }]);

            if (error) throw error;

            setMessage({ type: 'success', text: "New task created successfully. 📝" });
            setTimeout(() => setMessage(null), 3000);
            setIsAdding(false);
            setNewTask({ title: '', description: '', priority: 'Medium' });
            fetchTasks();
        } catch (err) {
            console.error(err);
        }
    };

    const updateTaskStatus = async (id: string, status: Task['status']) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('admin_tasks').update({ status }).eq('id', id);
            if (error) throw error;
            setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        } catch (err) {
            console.error(err);
        }
    };

    const deleteTask = async (id: string) => {
        if (!supabase) return;
        try {
            const { error } = await supabase.from('admin_tasks').delete().eq('id', id);
            if (error) throw error;
            setTasks(prev => prev.filter(t => t.id !== id));
            setMessage({ type: 'success', text: "Task deleted." });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const COLUMNS: Task['status'][] = ['Todo', 'InProgress', 'Review', 'Done'];

    return (
        <div className="p-8 space-y-10 bg-background min-h-screen text-left">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Layout className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Operations Board</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Task Control</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Coordinate internal workflows and resolve high-priority bottlenecks.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchTasks} variant="outline" className="rounded-xl h-12 px-6 border-border bg-card text-foreground font-black uppercase text-[10px] tracking-widest transition-all">
                        <RefreshCcw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Sync Board
                    </Button>
                    <Button onClick={() => setIsAdding(true)} className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <Plus className="h-4 w-4 mr-2" /> New Task
                    </Button>
                </div>
            </header>

            {message && (
                <div className={cn(
                    "p-6 rounded-[2.5rem] border-2 flex items-center gap-4 animate-in slide-in-from-top-4",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <p className="text-sm font-black uppercase tracking-widest">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch min-h-[600px]">
                {COLUMNS.map(col => (
                    <div key={col} className="space-y-6 flex flex-col h-full bg-slate-50/50 p-4 rounded-[2.5rem] border border-slate-100">
                        <div className="flex items-center justify-between px-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    col === 'Todo' ? "bg-slate-300" :
                                    col === 'InProgress' ? "bg-primary animate-pulse" :
                                    col === 'Review' ? "bg-indigo-500" : "bg-emerald-500"
                                )}></div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{col}</h3>
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground bg-secondary px-2 py-0.5 rounded-lg border border-border">
                                {tasks.filter(t => t.status === col).length}
                            </span>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-10">
                            {tasks.filter(t => t.status === col).map(task => (
                                <Card key={task.id} className="p-6 rounded-[2rem] border border-border bg-card shadow-sm hover:shadow-xl transition-all group cursor-grab active:cursor-grabbing h-auto">
                                    <div className="space-y-4 h-full flex flex-col justify-between">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border",
                                                    task.priority === 'Critical' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                    task.priority === 'High' ? "bg-primary/5 text-primary border-primary/10" :
                                                    "bg-slate-50 text-slate-400 border-slate-100"
                                                )}>{task.priority}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={14} /></button>
                                                    <button className="text-slate-300 hover:text-primary transition-colors p-1"><MoreVertical size={14} /></button>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-foreground uppercase tracking-tight leading-tight">{task.title}</h4>
                                                <p className="text-[10px] text-muted-foreground font-medium mt-1 line-clamp-2 italic leading-relaxed">&quot;{task.description}&quot;</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-border flex justify-between items-center mt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[8px] font-black text-primary border border-border">
                                                    {task.assigned_to?.substring(0, 1)}
                                                </div>
                                                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{task.assigned_to}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {col !== 'Todo' && (
                                                    <button
                                                        onClick={() => updateTaskStatus(task.id, COLUMNS[COLUMNS.indexOf(col) - 1])}
                                                        className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-white hover:text-foreground transition-all shadow-sm border border-slate-100"
                                                    >
                                                        <ChevronRight size={12} className="rotate-180" />
                                                    </button>
                                                )}
                                                {col !== 'Done' && (
                                                    <button
                                                        onClick={() => updateTaskStatus(task.id, COLUMNS[COLUMNS.indexOf(col) + 1])}
                                                        className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    >
                                                        <ChevronRight size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {tasks.filter(t => t.status === col).length === 0 && (
                                <div className="py-12 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-center opacity-20 group hover:opacity-100 transition-opacity min-h-[200px]">
                                    <CheckCircle2 size={32} className="mb-2" />
                                    <p className="text-[8px] font-black uppercase tracking-widest italic">Column Optimized</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/20 backdrop-blur-md p-6">
                    <Card className="max-w-md w-full bg-card rounded-[3rem] border border-border shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Zap size={24} /></div>
                            <h3 className="text-2xl font-black uppercase text-foreground tracking-tighter">New Task</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Task Title</label>
                                <Input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground" placeholder="e.g. Audit Inventory" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Priority</label>
                                <select
                                    value={newTask.priority}
                                    onChange={e => setNewTask({...newTask, priority: e.target.value as Task['priority']})}
                                    className="w-full h-14 rounded-2xl bg-secondary border border-border px-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                    <option>Critical</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <Button onClick={handleCreateTask} className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">Create</Button>
                            <Button onClick={() => setIsAdding(false)} variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-[10px] border-border">Cancel</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
