'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreVertical,
    Calendar,
    Users,
    Trash2,
    Loader2,
    RefreshCcw,
    ChevronRight,
    Zap,
    Layout
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

    const fetchTasks = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            // Check if table exists, if not, use mock data for now to prevent crash
            const { data, error } = await supabase.from('admin_tasks').select('*').order('created_at', { ascending: false });
            if (error) {
                if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                    // Mock data for initial UI
                    setTasks([
                        { id: '1', title: 'Restock AMAYA AM-05', description: 'Inventory level dropped below 5 units.', status: 'Todo', priority: 'High', assigned_to: 'Logistics', due_date: '2026-08-11', created_at: new Date().toISOString() },
                        { id: '2', title: 'Verify Partner #104 Payout', description: 'Reconcile sales for last week.', status: 'InProgress', priority: 'Medium', assigned_to: 'Finance', due_date: '2026-08-10', created_at: new Date().toISOString() },
                        { id: '3', title: 'Update Brand Hero Image', description: 'New Platinum Series visuals arrived.', status: 'Review', priority: 'Low', assigned_to: 'Marketing', due_date: '2026-08-15', created_at: new Date().toISOString() }
                    ]);
                } else {
                    throw error;
                }
            } else {
                setTasks(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTasks();
    }, []);

    const updateTaskStatus = async (id: string, status: Task['status']) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        // Logic to update DB if table exists
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
                        <RefreshCcw className="h-4 w-4 mr-2" /> Sync Board
                    </Button>
                    <Button onClick={() => setIsAdding(true)} className="rounded-xl h-12 px-8 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                        <Plus className="h-4 w-4 mr-2" /> New Protocol
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {COLUMNS.map(col => (
                    <div key={col} className="space-y-6">
                        <div className="flex items-center justify-between px-4">
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

                        <div className="space-y-4">
                            {tasks.filter(t => t.status === col).map(task => (
                                <Card key={task.id} className="p-6 rounded-[2rem] border border-border bg-card shadow-sm hover:shadow-xl transition-all group cursor-grab active:cursor-grabbing">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <span className={cn(
                                                "px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border",
                                                task.priority === 'Critical' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                                task.priority === 'High' ? "bg-primary/5 text-primary border-primary/10" :
                                                "bg-slate-50 text-slate-400 border-slate-100"
                                            )}>{task.priority}</span>
                                            <button className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={14} /></button>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-foreground uppercase tracking-tight leading-tight">{task.title}</h4>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-1 line-clamp-2 italic leading-relaxed">&quot;{task.description}&quot;</p>
                                        </div>
                                        <div className="pt-4 border-t border-border flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[8px] font-black text-primary border border-border">
                                                    {task.assigned_to?.substring(0, 1)}
                                                </div>
                                                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{task.assigned_to}</span>
                                            </div>
                                            <div className="flex gap-1">
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
                                <div className="py-12 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-center opacity-20 group hover:opacity-100 transition-opacity">
                                    <CheckCircle2 size={32} className="mb-2" />
                                    <p className="text-[8px] font-black uppercase tracking-widest italic">Column Optimized</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
