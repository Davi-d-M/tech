'use client';

import * as React from 'react';
import {
    Users,
    Mail,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TeamProvisioningProps {
    onComplete: () => void;
}

export default function TeamProvisioning({ onComplete }: TeamProvisioningProps) {
    const [emails, setEmails] = React.useState<string[]>(['']);
    const [isInviting, setIsInviting] = React.useState(false);
    const [invitedCount, setInvitedCount] = React.useState(0);

    const addField = () => setEmails([...emails, '']);

    const handleInvite = async () => {
        setIsInviting(true);
        try {
            // Simulated Bulk Invitation logic (SaaS Protocol)
            // In a real app, this calls an API to send emails + generate DB invitation rows
            await new Promise(r => setTimeout(r, 2000));
            setInvitedCount(emails.filter(e => e.includes('@')).length);
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <Card className="max-w-xl w-full p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-2xl space-y-10 text-left relative overflow-hidden">
            <header className="space-y-1 relative z-10">
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.4em]">Organization Node</p>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Team Provisioning</h2>
                <p className="text-sm text-slate-400 font-medium italic mt-2">Scale your workforce. Invite managers, staff, and riders to your grid.</p>
            </header>

            {invitedCount > 0 ? (
                <div className="py-10 text-center space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mx-auto">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Personnel Linked</h3>
                        <p className="text-sm text-slate-500 font-medium italic px-10">
                            {invitedCount} activation links have been transmitted to your team.
                        </p>
                    </div>
                    <Button onClick={onComplete} className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl">
                        Continue to HQ
                    </Button>
                </div>
            ) : (
                <div className="space-y-8 relative z-10">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Personnel Email List</p>
                        <div className="space-y-3">
                            {emails.map((email, idx) => (
                                <div key={idx} className="relative">
                                    <Input
                                        value={email}
                                        onChange={e => {
                                            const newEmails = [...emails];
                                            newEmails[idx] = e.target.value;
                                            setEmails(newEmails);
                                        }}
                                        placeholder="colleague@business.ke"
                                        className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 font-bold"
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                </div>
                            ))}
                        </div>
                        <button onClick={addField} className="text-[9px] font-black uppercase text-indigo-600 hover:underline px-1">+ Add more seats</button>
                    </div>

                    <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-start gap-4">
                        <ShieldCheck size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-indigo-600 font-medium leading-relaxed italic">
                            &quot;Each link is a secure 24-hour token. Your team will inherit organization permissions automatically upon activation.&quot;
                        </p>
                    </div>

                    <Button
                        onClick={handleInvite}
                        disabled={isInviting || emails.every(e => !e.includes('@'))}
                        className="w-full h-20 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-200 active:scale-95 transition-all"
                    >
                        {isInviting ? <Loader2 className="animate-spin h-6 w-6 mx-auto" /> : <>Initiate Team Link <ArrowRight className="ml-3 h-4 w-4" /></>}
                    </Button>
                </div>
            )}

            <Users className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-50 -z-0 rotate-12" />
        </Card>
    );
}
