"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Package, Smartphone, MessageSquare, ArrowRight, Truck, ShieldCheck, Heart, Zap } from "lucide-react";
import Link from "next/link";
import { formatPrice, getReferralLink } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useSettings } from "@/lib/useSettings";

interface Order {
    id: number;
    customer_name: string;
    total_price: number;
    status: string;
    user_id: string | null;
    session_id: string | null;
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [order, setOrder] = useState<Order | null>(null);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { settings } = useSettings();

    useEffect(() => {
        const client = supabase;
        if (client) {
            const fetchData = async () => {
                const { data: { session } } = await client.auth.getSession();
                const browserSessionId = localStorage.getItem('apex_session_id');

                // 1. Fetch Order
                if (orderId) {
                    const { data: oData } = await client.from('orders').select('*').eq('id', orderId).single();

                    // SECURITY CHECK: Is this your order? (UID check or Session Check for guests)
                    const isOwner = oData && (
                        (session && oData.user_id === session.user.id) ||
                        (browserSessionId && oData.session_id === browserSessionId)
                    );

                    if (oData && !isOwner) {
                        alert("Unauthorized Payload Access 🛡️");
                        window.location.href = '/';
                        return;
                    }

                    if (oData) setOrder(oData as unknown as Order);
                }

                // 2. Fetch User Referral Code
                if (session) {
                    const { data: pData } = await client.from('profiles').select('referral_code').eq('id', session.user.id).single();
                    if (pData) setReferralCode(pData.referral_code);
                }

                setLoading(false);
            };
            fetchData();
        }
    }, [orderId]);

    const shareToWhatsApp = () => {
        if (!order) return;
        const message = `Hello Apexstores! I just placed an order.\n\n*Order ID:* #${order.id}\n*Customer:* ${order.customer_name}\n*Total:* ${formatPrice(order.total_price)}\n\nPlease confirm my dispatch status. Thanks!`;
        window.open(`https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex min-h-[60dvh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
            <div className="mb-12 flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 animate-pulse">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-2">Order Confirmed</h1>
                <p className="text-slate-500 font-medium italic">Your tech is officially secured. Preparing for dispatch.</p>
            </div>

            <Card className="rounded-[2.5rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden mb-10">
                <CardContent className="p-0">
                    <div className="bg-slate-50 p-8 border-b border-slate-100 flex items-center justify-between text-left">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order ID</p>
                            <h3 className="text-xl font-black text-foreground">#{order?.id || 'Pending'}</h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[9px] font-bold text-primary uppercase tracking-wider">
                                {order?.status || 'Paid'}
                            </span>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Summary */}
                        <div className="flex items-center gap-4 text-left">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground">Tech Secured</h4>
                                <p className="text-sm text-slate-500">We&apos;ve received your payment and are validating the items.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-left">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Truck className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground">Fast Dispatch</h4>
                                <p className="text-sm text-slate-500">Our rider will contact you within 1-3 hours for delivery.</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-dashed border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-slate-500 font-medium">Total Amount Paid</span>
                                <span className="text-2xl font-black text-foreground">{formatPrice(order?.total_price || 0)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    onClick={shareToWhatsApp}
                                    variant="outline"
                                    className="rounded-2xl h-14 border-slate-200 font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all"
                                >
                                    <MessageSquare className="h-4 w-4" /> Get Receipt
                                </Button>
                                <Button
                                    asChild
                                    className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-primary/20"
                                >
                                    <Link href={`/track?id=${order?.id}`}>
                                        Track Order <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Elite Invitation Section */}
            {referralCode && (
                <Card className="rounded-[2.5rem] border-2 border-primary/10 bg-primary/5 shadow-2xl p-10 mb-10 overflow-hidden relative group">
                    <div className="relative z-10 text-center space-y-6">
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-primary shadow-xl group-hover:scale-110 transition-transform">
                            <Zap className="h-8 w-8 fill-current" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none mb-2">Invite Friends, <br /> <span className="text-primary italic">Earn Ksh 200</span></h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed italic">&quot;Help your squad level up their gear. Both of you get Ksh 200 credit upon their first tech mission.&quot;</p>
                        </div>
                        <Button
                            onClick={() => {
                                const text = `Yo! I just secured elite gear from Apexstores. Use my link to get a member discount: ${getReferralLink(referralCode)}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                        >
                            WhatsApp Invitation
                        </Button>
                    </div>
                    <Zap className="absolute -bottom-10 -right-10 h-48 w-48 text-primary/5 rotate-12 -z-0" />
                </Card>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Secure Payment
                </div>
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" /> Original Tech
                </div>
                <div className="flex items-center gap-2 text-foreground">
                    <Heart className="h-4 w-4 text-rose-500 fill-rose-500" /> Thanks for choosing Apex
                </div>
            </div>

            <div className="mt-12">
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary" asChild>
                    <Link href="/">Return to Storefront</Link>
                </Button>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
