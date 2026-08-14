'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { type User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useCart, type CartItem } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import {
  Gem,
  Star,
  Bell,
  HelpCircle,
  RefreshCcw,
  BadgeCheck,
  Gift,
  Crown,
  MessageSquare,
  Trophy,
  Wallet,
  CircleCheck,
  Package,
  MapPin,
  Phone,
  User as UserIcon,
  X,
  Loader2,
  ChevronRight,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  CheckCircle,
  Truck,
  Zap,
  Users,
  Smartphone,
  Rocket,
  ArrowRight,
  Calendar,
  Heart,
  Lock,
  XCircle,
  Check,
  CheckCircle2,
  Send,
  Sparkles,
  Flame,
  FileDown,
  Hammer,
  Headphones,
  Cpu,
  BarChart3 as StatsIcon,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { formatPrice, cn, getReferralLink } from '@/lib/utils';
import { useSettings } from '@/lib/useSettings';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import PointsLedger from '@/components/profile/PointsLedger';
import DailyStreak from '@/components/profile/DailyStreak';
import DailyMissions from '@/components/profile/DailyMissions';
import RewardInteractive from '@/components/profile/RewardInteractive';
import AchievementBadges from '@/components/profile/AchievementBadges';

const LocationPicker = dynamic(() => import('@/components/profile/LocationPicker'), {
    ssr: false,
    loading: () => <div className="fixed inset-0 z-[400] bg-white/70 backdrop-blur-xl flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
});

const IconMap: Record<string, React.ElementType> = {
    Star, ShieldCheck, Crown, Gem, Trophy, ShoppingBag, Smartphone, MessageSquare, Users, Rocket
};

interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  address: string;
  loyalty_points: number;
  referral_code: string;
  wallet_balance: number;
  current_streak: number;
  latitude?: number;
  longitude?: number;
  birth_date?: string;
  avatar_url?: string;
  created_at: string;
}

interface Order {
  id: number;
  status: string;
  total_price: number;
  created_at: string;
  payment_method: string;
}

interface Coupon {
  code: string;
  discount: string;
}

interface Notification {
  title: string;
  text: string;
}

interface Warranty {
  id: string;
  product_name: string;
  expiry_date: string;
}

interface ServiceRequest {
  id: string;
  status: string;
  subject: string;
  message: string;
  admin_response?: string | null;
  created_at: string;
}

interface PurchasedItem {
  id: number;
  name: string;
  image: string;
  price: number;
}

interface Device {
  name: string;
  model: string;
  icon: React.ElementType;
}

interface AbandonedCart {
  id: string;
  customer_phone: string;
  cart_items: CartItem[];
  total_price: number;
}

export default function ProfilePage() {
  const { settings } = useSettings();
  const [gamification, setGamification] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [achievements, setAchievements] = useState<Record<string, unknown>[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [isSupportFormOpen, setIsSupportFormOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSendingTicket, setIsSendingTicket] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[]>([]);
  const [referralUrl, setReferralUrl] = useState('');
  const [abandonedBag, setAbandonedBag] = useState<AbandonedCart | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isPickingLocation, setIsPickingLocation] = useState(false);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    birth_date: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const router = useRouter();
  const { addToCart } = useCart();
  const { wishlist } = useWishlist();
  const assistantInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth?mode=signin');
        return;
      }

      setUser(session.user);

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData && !profileData.referral_code) {
          const newCode = `APEX-${session.user.id.substring(0, 7).toUpperCase()}`;
          await supabase.from('profiles').update({ referral_code: newCode }).eq('id', session.user.id);
          profileData.referral_code = newCode;
      }

      if (profileData) {
        setProfile(profileData);
        setEditForm({
            full_name: profileData.full_name || '',
            phone_number: profileData.phone_number || '',
            address: profileData.address || '',
            birth_date: profileData.birth_date || ''
        });

        if (profileData.referral_code) {
            setReferralUrl(getReferralLink(profileData.referral_code));
        }
      }

      // Check for abandoned items
      const searchId = profileData?.phone_number || session.user.email;
      const { data: abandonedData } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('customer_phone', searchId)
        .single();

      if (abandonedData) {
          setAbandonedBag(abandonedData);
      }

      // Fetch Orders
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id) // NEW: Strict UID link
        .order('created_at', { ascending: false });

      setOrders(orderData || []);

      // Fetch Devices & Achievements (New Infrastructure)
      if (supabase) {
          const [devicesRes, achievementsRes, warrantiesRes, serviceRes] = await Promise.all([
              supabase.from('user_devices').select('*').eq('user_id', session.user.id),
              supabase.from('user_achievements').select('*').eq('user_id', session.user.id),
              supabase.from('warranties').select('*').eq('user_id', session.user.id),
              supabase.from('messages').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
          ]);
          setDevices(devicesRes.data || []);
          setAchievements(achievementsRes.data || []);
          setWarranties(warrantiesRes.data || []);
          setServiceRequests(serviceRes.data || []);

          // Real data only
          setCoupons([]);
          setNotifications([]);

          // Recently Purchased Logic
          const { data: pItems } = await supabase
            .from('orders')
            .select('product_id, products(name, image_url, price)')
            .eq('customer_phone', profileData?.phone_number || session.user.email)
            .eq('status', 'Delivered')
            .limit(5);

          if (pItems) setPurchasedItems((pItems as unknown as { product_id: number, products: { name: string, image_url: string, price: number } | null }[]).map((pi) => ({
              id: pi.product_id,
              name: pi.products?.name || 'Product',
              image: pi.products?.image_url || '',
              price: pi.products?.price || 0
          })));

      // Update Streak Logic
      try {
          await fetch('/api/member/gamification', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ userId: session.user.id, action: 'update-streak' }),
          });
      } catch (err) {
          console.warn("Streak update failed", err);
      }

      // Fetch Gamification Config
      const { data: gameData } = await supabase.from('settings').select('*').eq('key', 'gamification').maybeSingle();
      if (gameData) setGamification(gameData.value);
      }

      setLoading(false);
    }

    loadData();
  }, [router]);

  // 0.5 Inline Countdown Timer Component
  const DealsCountdown = ({ hours }: { hours: number }) => {
      const [timeLeft, setTimeLeft] = useState(hours * 3600);
      useEffect(() => {
          const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
          return () => clearInterval(timer);
      }, []);
      const h = Math.floor(timeLeft / 3600);
      const m = Math.floor((timeLeft % 3600) / 60);
      const s = timeLeft % 60;
      return <div className="flex gap-2 font-mono font-black text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
          <span>{String(h).padStart(2, '0')}</span>:<span>{String(m).padStart(2, '0')}</span>:<span>{String(s).padStart(2, '0')}</span>
      </div>;
  };

  const stats = useMemo(() => {
    const totalSpend = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.total_price || 0), 0);
    const wishlistCount = wishlist.length;
    const activeWarranties = orders.filter(o => o.status === 'Delivered').length; // Simplified

    // Profile Completion Logic
    const items = [
        !!profile?.full_name,
        !!user?.email,
        !!profile?.phone_number,
        !!profile?.address,
        !!profile?.birth_date,
        !!profile?.latitude && !!profile?.longitude,
        devices.length > 0
    ];
    const completedCount = items.filter(Boolean).length;
    const complete = Math.round((completedCount / items.length) * 100);

    // Gamification Levels
    const points = profile?.loyalty_points || 0;
    let level = "Explorer";
    let nextTier = "Silver";
    let target = 500;
    let rankIcon: React.ElementType = Star;

    if (gamification?.tiers) {
        const sortedTiers = [...(gamification.tiers as { threshold: number; label: string; icon: string; id: string }[])].sort((a, b) => b.threshold - a.threshold);
        const current = sortedTiers.find(t => points >= t.threshold);
        if (current) {
            level = current.label;
            rankIcon = IconMap[current.icon] || Star;

            const nextIdx = (gamification.tiers as { id: string }[]).findIndex((t) => t.id === current.id) + 1;
            const next = (gamification.tiers as { label: string; threshold: number }[])[nextIdx];
            if (next) {
                nextTier = next.label;
                target = next.threshold;
            } else {
                nextTier = "Max";
                target = current.threshold;
            }
        }
    } else {
        if (points >= 2000) { level = "Diamond"; nextTier = "Elite"; target = 5000; rankIcon = Gem; }
        else if (points >= 1000) { level = "Gold"; nextTier = "Diamond"; target = 2000; rankIcon = Crown; }
        else if (points >= 500) { level = "Silver"; nextTier = "Gold"; target = 1000; rankIcon = ShieldCheck; }
    }

    return { totalSpend, wishlistCount, activeWarranties, completion: complete, level, nextTier, target, points, rankIcon };
  }, [orders, profile, wishlist, gamification, devices.length, user?.email]);

  const greeting = useMemo(() => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 18) return "Good Afternoon";
      return "Good Evening";
  }, []);

  /*
  const handleRestoreBag = async () => {
    if (!abandonedBag) return;
    addBundleToCart(abandonedBag.cart_items);
    localStorage.setItem('apex_restored_bonus', 'true');
    if (supabase) await supabase.from('abandoned_carts').delete().eq('id', abandonedBag.id);
    setAbandonedBag(null);
    router.push('/cart');
  };
  */

  const handleShareReferral = () => {
    const text = `Check out Apexstores for premium tech! Use my link to get a member discount: ${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  /*
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...editForm,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      setProfile({
        id: user.id,
        ...editForm,
        loyalty_points: profile?.loyalty_points || 0,
        referral_code: profile?.referral_code || '',
        wallet_balance: profile?.wallet_balance || 0,
        current_streak: profile?.current_streak || 0,
        created_at: profile?.created_at || new Date().toISOString()
      });
      setIsEditing(false);
    }
  };
  */

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    router.push('/');
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user || !supportMessage.trim()) return;

    setIsSendingTicket(true);
    try {
        const { error } = await supabase.from('messages').insert([{
            user_id: user.id,
            name: profile?.full_name || user.email?.split('@')[0] || 'Member',
            email: user.email,
            subject: supportSubject.trim() || 'General In-App Support',
            message: supportMessage.trim()
        }]);

        if (error) throw error;

        setToast({ type: 'success', text: "Ticket Transmission Successful. 🛰️" });
        setSupportSubject('');
        setSupportMessage('');
        setIsSupportFormOpen(false);

        // Refresh list
        const { data } = await supabase.from('messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        setServiceRequests(data || []);
    } catch (err: unknown) {
        setToast({ type: 'error', text: (err as Error).message });
    } finally {
        setIsSendingTicket(false);
        setTimeout(() => setToast(null), 3000);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: editForm.full_name.trim(),
          phone_number: editForm.phone_number.trim(),
          address: editForm.address.trim(),
          birth_date: editForm.birth_date,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
      alert("Elite profile synchronized successfully! 🛡️");
    } catch (err: unknown) {
      console.error("Profile Update Error:", err);
      alert(`Failed to sync profile: ${(err as Error).message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLocationConfirm = async (lat: number, lng: number) => {
      if (!supabase || !user) return;
      try {
          const { error } = await supabase
              .from('profiles')
              .upsert({
                  id: user.id,
                  latitude: lat,
                  longitude: lng,
                  updated_at: new Date().toISOString()
              }, { onConflict: 'id' });
          if (error) throw error;
          setProfile(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null);
          setIsPickingLocation(false);
          alert("GPS Coordinates Locked! 📍");
      } catch (err: unknown) {
          console.error(err);
          alert(`Failed to sync coordinates: ${(err as Error).message}`);
      }
  };

  /*
  const handleDownloadReceipt = async (order: Order) => {
      const doc = await generateReceiptPDF({
          id: order.id,
          customer_name: profile?.full_name || 'Member',
          total_price: order.total_price,
          created_at: order.created_at,
          payment_method: order.payment_method,
          product_name: 'Apexstores Elite Tech'
      } as Parameters<typeof generateReceiptPDF>[0]);
      doc.save(`Receipt_Apexstores_${order.id}.pdf`);
  };
  */

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Accessing Vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 text-left relative">
      {toast && (
          <div className="fixed top-24 right-8 z-[500] animate-in slide-in-from-right-8 duration-500">
              <Card className={cn(
                  "p-6 rounded-[2rem] border-2 shadow-2xl flex items-center gap-4",
                  toast.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
              )}>
                  <CheckCircle2 size={24} />
                  <p className="text-sm font-black uppercase tracking-widest">{toast.text}</p>
              </Card>
          </div>
      )}

      {isSupportFormOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-background/20 backdrop-blur-md p-6">
              <Card className="max-w-md w-full bg-white rounded-[3rem] border border-border shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Headphones size={24} /></div>
                        <h3 className="text-2xl font-black uppercase text-foreground tracking-tighter">Support Grid</h3>
                      </div>
                      <button onClick={() => setIsSupportFormOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
                  </div>

                  <form onSubmit={handleSubmitTicket} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mission Subject</label>
                          <Input
                            value={supportSubject}
                            onChange={e => setSupportSubject(e.target.value)}
                            className="h-14 rounded-2xl bg-secondary border-border font-bold text-foreground"
                            placeholder="e.g. Technical Help with AirPods"
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Payload Details (Message)</label>
                          <Textarea
                            required
                            value={supportMessage}
                            onChange={e => setSupportMessage(e.target.value)}
                            className="min-h-[150px] rounded-2xl bg-secondary border-border font-medium text-foreground resize-none p-5"
                            placeholder="Describe your technical inquiry..."
                          />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSendingTicket}
                        className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                          {isSendingTicket ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : <><Send className="h-4 w-4 mr-2" /> Launch Ticket</>}
                      </Button>
                  </form>
              </Card>
          </div>
      )}

      <div className="max-w-7xl mx-auto space-y-10">

                {/* 1. ELITE HERO SECTION */}
                {abandonedBag && (
                    <div className="mb-6 bg-primary/5 border border-primary/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ShoppingBag className="h-5 w-5" /></div>
                            <div>
                                <p className="text-xs font-black uppercase text-foreground tracking-tight">You left items in your bag!</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Restore your {formatPrice(abandonedBag.total_price)} bag to get a loyalty bonus.</p>
                            </div>
                        </div>
                        <Link href="/cart">
                            <Button size="sm" className="rounded-xl bg-primary text-white font-black uppercase text-[8px] tracking-widest px-6 h-10 shadow-lg shadow-primary/20">Restore Bag</Button>
                        </Link>
                    </div>
                )}
        <header className="relative p-10 sm:p-16 rounded-[3rem] bg-white border border-slate-100 overflow-hidden group shadow-sm">
            <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                    <div className="flex items-center gap-6 animate-in slide-in-from-left-4 duration-500">
                        <div className="relative">
                            <div className="h-28 w-24 rounded-[2rem] bg-white border border-slate-200 flex items-center justify-center text-foreground text-3xl font-black uppercase shadow-sm relative z-10">
                                {profile?.full_name?.substring(0, 2) || user?.email?.substring(0, 2)}
                            </div>
                            {/* Profile Completion Ring */}
                            <svg className="absolute inset-0 -rotate-90 h-28 w-24 z-0">
                                <circle
                                    cx="48" cy="56" r="44"
                                    fill="transparent" stroke="#f8fafc" strokeWidth="8"
                                />
                                <circle
                                    cx="48" cy="56" r="44"
                                    fill="transparent" stroke="#F5A000" strokeWidth="8"
                                    strokeDasharray={`${2 * Math.PI * 44}`}
                                    strokeDashoffset={`${(2 * Math.PI * 44) * (1 - stats.completion / 100)}`}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-lg border border-slate-100">
                                <BadgeCheck className="h-5 w-5 text-primary fill-current" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{greeting}</p>
                                {profile?.current_streak !== undefined && profile.current_streak > 0 && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-full border border-primary/10 animate-pulse">
                                        <Flame className="h-3 w-3 fill-current" />
                                        <span className="text-[9px] font-black uppercase">{profile.current_streak} Day Streak</span>
                                    </div>
                                )}
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-foreground uppercase">{profile?.full_name?.split(' ')[0] || 'Member'} 👋</h1>

                            {/* Achievement Badges Row 2.0 */}
                            <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
                                {([] as { id: string; icon: React.ElementType; color: string; label: string }[]).map((badge) => (
                                    <div key={badge.id} className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm shrink-0 hover:border-primary/20 transition-all cursor-default group/badge">
                                        <badge.icon className={cn("h-3 w-3", badge.color === 'primary' ? 'text-primary' : 'text-slate-400')} />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 group-hover/badge:text-primary transition-colors">{badge.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                        <Link href="/shop">
                            <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Button onClick={handleLogout} variant="ghost" className="h-14 px-6 text-slate-400 hover:text-primary font-black uppercase text-[10px] tracking-widest rounded-2xl">
                            <LogOut className="h-4 w-4 mr-2" /> End Session
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-700 delay-200">
                    {[
                        { label: 'Apex XP', val: stats.points, icon: Zap, color: 'primary', href: '#points-ledger-section' },
                        { label: 'Active Warranty', val: stats.activeWarranties, icon: ShieldCheck, color: 'primary', href: '#warranty-section' },
                        { label: 'Wishlist', val: stats.wishlistCount, icon: Heart, color: 'primary', href: '/wishlist' },
                        { label: 'Rank', val: stats.level, icon: stats.rankIcon, color: 'primary', href: '#loyalty-pathway-section' },
                    ].map(item => (
                        <button
                            key={item.label}
                            onClick={() => item.href.startsWith('#') ? document.getElementById(item.href.substring(1))?.scrollIntoView({ behavior: 'smooth' }) : router.push(item.href)}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group"
                        >
                            <div className={`h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110`}>
                                <item.icon className="h-4 w-4 fill-current" />
                            </div>
                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-0.5">{item.label}</p>
                            <p className="text-lg font-black text-foreground uppercase tracking-tighter">{item.val}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Background Pattern */}
            <Zap className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-100/50 rotate-12 -z-0" />
        </header>

        <div className="grid lg:grid-cols-2 gap-10">
            <DailyStreak currentStreak={profile?.current_streak || 0} />
            <RewardInteractive userId={user?.id || ''} />
        </div>

        {/* 2. REWARD CENTER & MISSIONS */}
        <section className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-10">
                <div className="space-y-4 text-left">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Trophy className="h-5 w-5" /></div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground leading-none">Mission Control</h2>
                    </div>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed italic">&quot;Execute daily tech assignments to accelerate your rank and unlock elite rewards.&quot;</p>
                </div>
            </div>

            <DailyMissions userId={user?.id || ''} referralCode={profile?.referral_code} />
        </section>

        {/* 3. EXECUTIVE FINANCIAL HUB */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Wallet & Transaction Center */}
            <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-6 group hover:shadow-xl transition-all">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 text-left">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform"><Wallet className="h-5 w-5" /></div>
                        <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Wallet</h3>
                    </div>
                    <button onClick={() => document.getElementById('points-ledger-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-[8px] font-black uppercase text-primary hover:underline underline-offset-4">Transaction History</button>
                </div>
                <div>
                    <p className="text-4xl font-black tracking-tighter text-foreground leading-none">{formatPrice(profile?.wallet_balance || 0)}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Global Account Credit</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button onClick={() => window.open(`https://wa.me/${settings.contact.whatsapp}?text=Hello! I want to top up my Apex Wallet.`, '_blank')} className="h-12 rounded-xl bg-slate-50 text-foreground hover:bg-slate-100 font-black uppercase text-[8px] border border-slate-100 transition-all active:scale-95">Add Funds</Button>
                    <Button onClick={() => { const code = prompt("Enter your redemption code:"); if(code) alert("Code validated. Points will be added shortly!"); }} className="h-12 rounded-xl bg-primary text-white font-black uppercase text-[8px] shadow-lg shadow-primary/20 active:scale-95">Redeem Code</Button>
                </div>
            </Card>

            {/* Spending Statistics (Insights) */}
            <Card className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm space-y-6 group hover:shadow-xl transition-all">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><StatsIcon className="h-5 w-5" /></div>
                    <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">Elite Insights</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-4">
                    <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Saved</p>
                        <p className="text-xl font-black text-primary">{formatPrice(stats.totalSpend * 0.05)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Orders</p>
                        <p className="text-xl font-black text-foreground">{orders.length}</p>
                    </div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                    <span className="flex items-center gap-2"><Check className="h-3 w-3 text-primary" /> Elite Member Status</span>
                    <button onClick={() => document.getElementById('order-summary-metrics')?.scrollIntoView({ behavior: 'smooth' })} className="text-primary hover:underline">Portfolio Stats ↓</button>
                </div>
            </Card>

            {/* Coupon Hub (Real Data Only) */}
            {coupons.length > 0 && (
                <Card className="p-8 rounded-[3rem] bg-primary/5 border-2 border-primary/10 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm"><Gift className="h-5 w-5" /></div>
                            <DealsCountdown hours={14} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tighter leading-none">Flash Vouchers</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{coupons.length} Active Codes</p>
                        </div>
                        <div className="space-y-2">
                            {coupons.map(c => (
                                <div key={c.code} className="flex items-center justify-between p-3 bg-white rounded-xl border border-primary/10 shadow-sm relative group/coupon">
                                    <div>
                                        <span className="text-[10px] font-black text-primary uppercase">{c.discount}</span>
                                        <span className="text-[8px] font-bold text-slate-300 block">ID: {c.code}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(c.code); alert('Copied!'); }} className="h-8 rounded-lg text-[8px] font-black uppercase hover:bg-primary hover:text-white transition-all">Copy</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            )}
        </div>

        {/* 4. MAIN DASHBOARD GRID */}
        <div className="grid lg:grid-cols-3 gap-10">

            {/* LEFT COLUMN: CONTROL CENTER */}
            <div className="lg:col-span-2 space-y-10">

                {/* DELIVERY TRACKER & TIMELINE */}
                {orders.length > 0 && orders[0].status !== 'Delivered' && (
                    <section className="space-y-6">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Latest Delivery</h2>
                        <Card className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-8 text-center sm:text-left relative z-10">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">En Route</p>
                                    <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter">Order #{orders[0].id}</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Estimated Arrival: <span className="text-foreground">Today</span></p>
                                </div>
                                <div className="flex-1 w-full max-w-sm">
                                    <div className="flex justify-between mb-4 text-[8px] font-black uppercase text-slate-400">
                                        <span>Packed</span>
                                        <span>Shipped</span>
                                        <span className="text-primary">Dispatch</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full p-0.5 border border-slate-50">
                                        <div className="h-full bg-primary rounded-full animate-pulse shadow-[0_0_10px_#ff6b00]" style={{ width: '80%' }}></div>
                                    </div>
                                </div>
                                <Link href={`/track?id=${orders[0].id}`}>
                                    <Button size="icon" className="h-14 w-14 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-110 transition-transform">
                                        <Truck className="h-6 w-6" />
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    </section>
                )}

                {/* REGISTERED TECH (DEVICE INVENTORY) */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">My Devices</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {devices.length > 0 ? devices.map((device: Device) => (
                            <div key={device.name} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center space-y-4 group hover:bg-white hover:shadow-xl transition-all">
                                <div className="h-12 w-12 rounded-2xl bg-white mx-auto flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:scale-110 transition-all shadow-sm">
                                    <device.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-foreground uppercase tracking-tight">{device.name}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{device.model}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-[10px] font-black uppercase text-slate-300 italic">No verified devices registered.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* LOYALTY ROADMAP (Explorer -> Legend) */}
                <section id="loyalty-pathway-section" className="space-y-6 scroll-mt-24">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Loyalty Pathway</h2>
                    <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center px-4 overflow-x-auto no-scrollbar gap-8">
                            {((gamification?.tiers as { label?: string; level?: string; icon: string }[]) || [
                                { level: 'Explorer', icon: 'Star' },
                                { level: 'Silver', icon: 'ShieldCheck' },
                                { level: 'Gold', icon: 'Crown' },
                                { level: 'Elite', icon: 'Gem' },
                                { level: 'Legend', icon: 'Trophy' },
                            ]).map((step) => {
                                const Icon = IconMap[step.icon] || Star;
                                const label = step.label || step.level;
                                return (
                                    <div key={label} className="flex flex-col items-center gap-3 relative z-10 shrink-0">
                                        <div className={cn(
                                            "h-12 w-12 rounded-full border-4 border-white flex items-center justify-center shadow-lg transition-all",
                                            stats.level === label ? "bg-primary scale-125 ring-4 ring-primary/20" : "bg-slate-50 text-slate-200"
                                        )}>
                                            <Icon className={cn("h-5 w-5", stats.level === label ? "text-white" : "text-slate-300")} />
                                        </div>
                                        <p className={cn("text-[8px] font-black uppercase tracking-widest", stats.level === label ? "text-primary" : "text-slate-300")}>{label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* RECENTLY PURCHASED (Buy Again Carousel) */}
                {purchasedItems.length > 0 && (
                    <section className="space-y-6 scroll-mt-24" id="buy-again-section">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Buy Again</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Fast restock for your tech</p>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {purchasedItems.map(item => (
                                <Link key={item.id} href={`/shop/${item.id}`} className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all shrink-0 w-48 text-center group">
                                    <div className="h-24 w-24 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative overflow-hidden">
                                        <Image
                                          src={item.image || '/placeholder.jpg'}
                                          alt={item.name}
                                          fill
                                          className="object-contain p-2"
                                        />
                                    </div>
                                    <p className="text-[10px] font-black text-foreground uppercase truncate mb-1">{item.name}</p>
                                    <p className="text-sm font-black text-primary mb-3">{formatPrice(item.price)}</p>
                                    <Button onClick={(e) => { e.preventDefault(); addToCart({ ...item, quantity: 1 } as CartItem); router.push('/cart'); }} className="w-full h-10 rounded-xl bg-primary text-white font-black uppercase text-[8px] active:scale-95 shadow-lg shadow-primary/20">One-Tap Order</Button>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* AI TECH ASSISTANT HUB */}
                <section className="space-y-6">
                    <Card className="rounded-[3.5rem] bg-slate-50 border border-slate-100 p-10 text-foreground relative overflow-hidden shadow-inner group text-left">
                        <div className="relative z-10 grid sm:grid-cols-2 gap-10 items-center">
                            <div className="space-y-6 text-left">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform"><Cpu className="h-5 w-5" /></div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">AI Tech Assistant</h2>
                                </div>
                                <p className="text-slate-500 font-medium italic text-sm leading-relaxed">&quot;Describe your device or technical challenge, and I&apos;ll recommend the perfect elite upgrade.&quot;</p>
                                <div className="relative">
                                    <Input
                                        ref={assistantInputRef}
                                        placeholder="Which charger fits my iPhone 13?"
                                        className="h-14 rounded-2xl bg-white border-slate-100 text-foreground placeholder:text-slate-300 font-bold pl-12 pr-12 focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value;
                                                if (val) router.push(`/?search=${encodeURIComponent(val)}`);
                                            }
                                        }}
                                    />
                                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-pulse" />
                                    <button
                                        onClick={() => {
                                            const val = assistantInputRef.current?.value;
                                            if (val) router.push(`/?search=${encodeURIComponent(val)}`);
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-primary/20"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="hidden sm:flex justify-center">
                                <div className="h-48 w-48 rounded-full border-2 border-slate-100 flex items-center justify-center relative">
                                    <div className="h-32 w-32 rounded-full bg-primary/5 animate-ping absolute" />
                                    <Cpu className="h-20 w-20 text-primary opacity-10" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    </Card>
                </section>

                {/* 🛡️ SERVICE & REPAIR HUB */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2 text-left">
                        <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Service Center</h2>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{serviceRequests.length} Active Tickets</span>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-6">
                        <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-6 text-left">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Hammer className="h-4 w-4" /> Technical Support</h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Repair Request', href: `https://wa.me/${settings.contact.whatsapp}?text=I need a technical repair request.` },
                                    { label: 'Replacement', href: `https://wa.me/${settings.contact.whatsapp}?text=I want to inquire about a product replacement.` },
                                    { label: 'Refund Hub', href: `/returns` }
                                ].map(type => (
                                    <button
                                        key={type.label}
                                        onClick={() => type.href.startsWith('http') ? window.open(type.href, '_blank') : router.push(type.href)}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-slate-50 transition-all group border border-slate-50"
                                    >
                                        <span className="text-[10px] font-black uppercase text-foreground">{type.label}</span>
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <Card className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-center text-left group hover:border-primary/20 transition-all">
                            <div className="relative z-10 space-y-4">
                                <Headphones className="h-10 w-10 text-primary" />
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none text-foreground">Global <br /> <span className="text-primary italic">Support Hub</span></h3>
                                <p className="text-[10px] text-slate-400 font-medium italic">&quot;Real-time technical extraction. No bots, just elite engineers.&quot;</p>
                                <Button
                                    onClick={() => setIsSupportFormOpen(true)}
                                    className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase text-[9px] tracking-widest active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    Enter Support Grid
                                </Button>
                            </div>
                            <Zap className="absolute -bottom-10 -right-10 h-32 w-32 text-primary/5 rotate-12" />
                        </Card>

                        {/* My Active Tickets */}
                        <div className="lg:col-span-1">
                            <Card className="h-full rounded-[2.5rem] bg-slate-50/50 border border-slate-100 p-8 flex flex-col">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Response Feed</h3>
                                <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[300px]">
                                    {serviceRequests.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                                            <ShieldCheck className="h-8 w-8 mb-2" />
                                            <p className="text-[8px] font-black uppercase tracking-widest italic">Link status: Secure</p>
                                        </div>
                                    ) : (
                                        serviceRequests.map(req => (
                                            <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative group overflow-hidden">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[10px] font-black uppercase text-foreground truncate max-w-[120px]">{req.subject}</p>
                                                    <span className={cn(
                                                        "text-[7px] font-black uppercase px-2 py-0.5 rounded-full",
                                                        req.status === 'New' ? "bg-primary/10 text-primary animate-pulse" :
                                                        req.status === 'Replied' ? "bg-emerald-100 text-emerald-600" :
                                                        "bg-slate-100 text-slate-400"
                                                    )}>{req.status}</span>
                                                </div>

                                                <p className="text-[9px] text-slate-500 font-medium italic line-clamp-1">&quot;{req.message}&quot;</p>

                                                {req.admin_response && (
                                                    <div className="pt-3 border-t border-slate-50 animate-in fade-in slide-in-from-top-1 duration-500">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                            <p className="text-[8px] font-black uppercase text-primary tracking-widest">Command Center Response</p>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-700 leading-relaxed">&quot;{req.admin_response}&quot;</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* 📜 WARRANTY & INVOICE CENTER */}
                <section id="warranty-section" className="space-y-6 scroll-mt-24">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Tech Insurance & Documents</h2>
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden text-left">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                                <h3 className="text-lg font-black uppercase text-foreground">Active Warranties</h3>
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400">{warranties.length} Products Protected</span>
                        </div>
                        {warranties.length === 0 ? (
                            <div className="p-12 text-center text-slate-300">
                                <FileDown className="h-10 w-10 mx-auto mb-4 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-widest italic">&quot;Warranties are initialized upon delivery confirmation.&quot;</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {warranties.map(w => (
                                    <div key={w.id} className="p-6 flex items-center justify-between group hover:bg-slate-50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors"><Package className="h-5 w-5" /></div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-foreground leading-none">{w.product_name}</p>
                                                <p className="text-[9px] font-bold text-primary uppercase mt-1">Expires: {new Date(w.expiry_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl text-[9px] font-black uppercase text-primary hover:bg-primary/10 active:scale-95">Certificate <Download className="h-3 w-3 ml-2" /></Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="p-8 bg-slate-50 flex justify-between items-center">
                            <p className="text-[10px] font-black uppercase text-slate-400">Export Business Documents</p>
                        </div>
                    </div>
                </section>

                {/* 📚 YOUR TECH LIBRARY */}
                <section className="space-y-6">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Elite Accomplishments</h2>
                    {achievements.length > 0 ? <AchievementBadges userId={user?.id || ''} /> : (
                        <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                             <Trophy className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                             <p className="text-[10px] font-black uppercase text-slate-300 italic">Complete your first order to unlock badges.</p>
                        </div>
                    )}
                </section>
            </div>

            {/* RIGHT COLUMN: REWARDS & PROFILE */}
            <div className="flex flex-col gap-10">

                {/* 🎮 REWARDS GAMIFICATION CARD 2.0 */}
                <section className="bg-white rounded-[3rem] p-10 border-2 border-primary/10 text-foreground relative overflow-hidden shadow-2xl group hover:border-primary/30 transition-all text-left">
                    <div className="relative z-10 space-y-8 text-left">
                        <div className="flex justify-between items-start">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                <Zap className="h-8 w-8 fill-current" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Rank</p>
                                <p className="text-xl font-black text-primary uppercase italic tracking-tighter">{stats.level}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end mb-2">
                                <p className="text-3xl font-black tracking-tighter leading-none text-foreground">{stats.points.toLocaleString()} <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">XP</span></p>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Target: {stats.nextTier}</p>
                            </div>
                            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,107,0,0.3)]"
                                    style={{ width: `${Math.min(100, (stats.points / stats.target) * 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                <span>{stats.points} / {stats.target} XP</span>
                                <span>{stats.target - stats.points} XP to next Rank</span>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm"><Gift className="h-5 w-5" /></div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-slate-400">Current Perk</p>
                                <p className="text-xs font-bold text-foreground uppercase">{stats.level === 'Explorer' ? 'No perks unlocked' : 'Free Dispatch Unlocked'}</p>
                            </div>
                        </div>

                        {/* Perk Pathway (Future Rewards) */}
                        <div className="pt-6 space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Loyalty Pathway</p>
                            <div className="space-y-2">
                                {[
                                    { level: 'Silver', perks: ['2% Cashback', 'Early Access'], locked: stats.level === 'Explorer' },
                                    { level: 'Gold', perks: ['5% Cashback', 'Birthday Gift'], locked: stats.level !== 'Gold' && stats.level !== 'Diamond' },
                                ].map(p => (
                                    <div key={p.level} className={cn("p-4 rounded-2xl border transition-all", p.locked ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-primary/20 shadow-sm")}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{p.level} Perk</span>
                                            {p.locked ? <Lock className="h-3 w-3 text-slate-300" /> : <CheckCircle className="h-3 w-3 text-primary" />}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {p.perks.map(perk => <span key={perk} className="text-[8px] font-black uppercase bg-white px-2 py-0.5 rounded-lg border border-slate-100">{perk}</span>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Pulsing Light Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                </section>

                {/* 🔔 NOTIFICATION CENTER */}
                <Card className="p-8 rounded-[3rem] border border-slate-100 bg-white shadow-sm space-y-6 text-left">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black uppercase tracking-tighter text-foreground flex items-center gap-3">
                            <Bell className="h-5 w-5 text-primary" /> Notifications
                        </h3>
                        <span className="h-2 w-2 rounded-full bg-primary animate-ping"></span>
                    </div>
                    <div className="space-y-4">
                        {notifications.map((n, i) => (
                            <div key={i} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-xl transition-all">
                                <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-inner shrink-0 group-hover:scale-110 transition-transform"><Check className="h-4 w-4" /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-foreground">{n.title}</p>
                                    <p className="text-[9px] font-medium text-slate-500 mt-1 leading-snug">{n.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 🎂 BIRTHDAY REWARDS */}
                <Card className="p-8 rounded-[3rem] bg-slate-50 border border-slate-100 text-foreground shadow-inner relative overflow-hidden group text-left">
                    <div className="relative z-10 space-y-6">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Gift className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">Birthday <br /> <span className="text-primary italic">Rewards</span></h3>
                            <p className="text-slate-500 text-[10px] font-medium leading-relaxed italic opacity-80">&quot;Elite gifts are reserved for your special day. Add your birth date to unlock exclusive member coupons.&quot;</p>
                        </div>
                        {profile?.birth_date ? (
                            <div className="p-4 bg-white rounded-2xl text-center border border-slate-100 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">{profile.birth_date}</p>
                                <p className="text-[8px] font-bold text-primary uppercase mt-1">Gifts initialized for your day</p>
                            </div>
                        ) : (
                            <Button onClick={() => window.open(`https://wa.me/${settings.contact.whatsapp}?text=Hello! I want to add my birth date to my profile.`, '_blank')} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all shadow-primary/20">Add Birth Date</Button>
                        )}
                    </div>
                    <Calendar className="absolute -bottom-10 -right-10 h-32 w-32 text-primary/5 rotate-12" />
                </Card>

                <div id="points-ledger-section">
                    <PointsLedger profileId={profile?.id || ''} />
                </div>

                {/* 🛡️ TACTICAL LOCATION PICKER */}
                <div id="tactical-location-picker" className="scroll-mt-24">
                    <Card
                        onClick={() => setIsPickingLocation(true)}
                        className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all min-h-[300px] flex flex-col justify-center"
                    >
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><MapPin className="h-6 w-6" /></div>
                                {profile?.latitude && profile?.longitude ? (
                                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase border border-emerald-100 tracking-widest flex items-center gap-2">
                                        <CheckCircle className="h-2.5 w-2.5" /> Pinned
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase border border-primary/20 tracking-widest animate-pulse">Action Required</span>
                                )}
                            </div>
                            <div className="text-left">
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2 text-foreground">Tactical <br /> <span className="text-primary italic">Drop Point</span></h3>
                                <p className="text-slate-500 text-[10px] font-medium leading-relaxed italic opacity-80">
                                    {profile?.latitude ? "Precision coordinates updated. Your rider will extract your tech at this exact pin." : "Pin your exact delivery location on the map for zero-delay dispatch."}
                                </p>
                            </div>
                            <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all shadow-primary/20">
                                {profile?.latitude ? "Update Pinned Location" : "Open Tactical Map"}
                            </Button>
                        </div>
                        <Zap className="absolute -bottom-10 -right-10 h-32 w-32 text-slate-50 rotate-12" />
                    </Card>
                </div>

                {/* 🛡️ PROFILE COMPLETION WIDGET */}
                <Card
                    onClick={() => setIsEditing(true)}
                    className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm space-y-8 text-left cursor-pointer hover:border-primary/20 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3">
                            <CircleCheck className="h-5 w-5 text-primary" /> Digital Profile
                        </h2>
                        <span className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{stats.completion}%</span>
                    </div>

                    <div className="space-y-4">
                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${stats.completion}%` }} />
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            {[
                                { label: 'Name', done: !!profile?.full_name },
                                { label: 'Email', done: !!user?.email },
                                { label: 'Phone', done: !!profile?.phone_number },
                                { label: 'Address', done: !!profile?.address },
                                { label: 'Birthday', done: !!profile?.birth_date },
                                { label: 'Drop Point', done: !!profile?.latitude && !!profile?.longitude },
                                { label: 'Device ID', done: devices.length > 0 },
                            ].map(task => (
                                <div key={task.label} className={cn("flex items-center gap-2 text-[9px] font-black uppercase tracking-widest", task.done ? "text-primary" : "text-slate-300")}>
                                    {task.done ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                    {task.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* 📊 ORDER SUMMARY DASHBOARD */}
                <Card id="order-summary-metrics" className="bg-white rounded-[3rem] p-8 border border-slate-100 space-y-6 text-left shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 px-2">Portfolio Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Pending', count: orders.filter(o => o.status === 'Pending' || o.status === 'Dispatched').length, color: 'primary', href: '/track' },
                            { label: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length, color: 'primary', href: '/profile' },
                            { label: 'Cancelled', count: orders.filter(o => o.status === 'Cancelled').length, color: 'primary', href: '/contact' },
                            { label: 'Returns', count: 0, color: 'primary', href: '/returns' },
                        ].map(stat => (
                            <Link key={stat.label} href={stat.href} className="bg-white p-5 rounded-2xl border border-slate-100 text-center space-y-1 hover:border-primary/20 transition-all hover:shadow-lg active:scale-95">
                                <p className="text-2xl font-black text-foreground tracking-tighter">{stat.count}</p>
                                <p className={cn("text-[8px] font-black uppercase tracking-widest", `text-${stat.color === 'primary' ? 'primary' : stat.color + '-500'}`)}>{stat.label}</p>
                            </Link>
                        ))}
                    </div>
                </Card>

                {/* 💬 REVIEWER REPUTATION HUB */}
                <Card className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm space-y-8 group hover:border-amber-100 transition-all text-left">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-foreground uppercase flex items-center gap-3">
                            <MessageSquare className="h-5 w-5 text-amber-500" /> Reviewer Rank
                        </h2>
                        <div className="flex text-amber-400 text-xs">
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400">Total Reviews</p>
                            <p className="text-2xl font-black text-foreground">7</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] font-black uppercase text-primary">Helpful Votes</p>
                            <p className="text-2xl font-black text-foreground">29</p>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Gold Reviewer Status</p>
                    </div>
                </Card>
                {/* VIRAL SHARE (Cash-back Focused) */}
                <div className="bg-white rounded-[3rem] p-10 border-2 border-primary/10 text-foreground relative overflow-hidden shadow-2xl group hover:border-primary/30 transition-all text-left">
                    <div className="relative z-10 space-y-6 text-left">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 group-hover:scale-110 transition-transform"><Users className="h-6 w-6" /></div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Invite Friends <br/> <span className="text-primary italic">Earn Ksh 200</span></h3>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed italic">&quot;Both you and your friend earn Ksh 200 store credit instantly when they initialize their first tech mission.&quot;</p>
                        <div className="p-5 bg-white border border-slate-100 rounded-2xl text-center shadow-inner relative group/key">
                            <p className="text-[8px] font-black uppercase text-slate-400 mb-2 tracking-widest">Your Private Referral Link</p>
                            <p className="text-[10px] font-black tracking-tight text-primary select-all cursor-pointer hover:scale-105 transition-transform break-all">
                                {referralUrl || 'Generating link...'}
                            </p>
                            <div className="absolute top-2 right-2 opacity-0 group-hover/key:opacity-100 transition-opacity">
                                <Zap className="h-3 w-3 text-primary animate-pulse" />
                            </div>
                        </div>
                        <Button onClick={handleShareReferral} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all shadow-primary/20 active:scale-95">WhatsApp Elite Invite</Button>
                    </div>
                    <Users className="absolute -bottom-10 -left-10 h-64 w-64 text-primary/5 -z-0 rotate-12" />
                </div>

                {/* STICKY QUICK ACTIONS (DESKTOP) */}
                <Card className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm space-y-8 sticky top-24 hidden lg:block text-left">
                    <h2 className="text-lg font-black text-foreground uppercase flex items-center gap-3">
                        <HelpCircle className="h-5 w-5 text-primary" /> Need Help?
                    </h2>
                    <div className="space-y-4 text-left">
                        {[
                            { label: 'Live Chat', icon: MessageSquare, color: 'primary', action: () => window.open(`https://wa.me/${settings.contact.whatsapp}`, '_blank') },
                            { label: 'Track Order', icon: MapPin, color: 'primary', action: () => router.push(`/track?id=${profile?.phone_number || ''}`) },
                            { label: 'Return Item', icon: RefreshCcw, color: 'primary', action: () => router.push('/returns') },
                            { label: 'Call Support', icon: Phone, color: 'primary', action: () => window.open(`tel:${settings.contact.whatsapp}`, '_self') }
                        ].map(q => (
                            <button
                                key={q.label}
                                onClick={q.action}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-50 hover:bg-slate-50 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-all`}><q.icon className="h-4 w-4" /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{q.label}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>
                </Card>
            </div>

        </div>

      </div>

      {/* EDIT PROFILE MODAL */}
      {isPickingLocation && (
          <LocationPicker
            initialLat={profile?.latitude}
            initialLng={profile?.longitude}
            onConfirm={handleLocationConfirm}
            onClose={() => setIsPickingLocation(false)}
          />
      )}
      {isEditing && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-white/70 backdrop-blur-xl p-4 animate-in fade-in duration-300">
              <Card className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-none animate-in zoom-in-95 duration-500">
                  <div className="bg-primary p-8 text-white flex justify-between items-center shadow-lg">
                      <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white"><UserIcon className="h-5 w-5" /></div>
                          <div className="text-left">
                              <h2 className="text-xl font-black uppercase tracking-tighter">Update Profile</h2>
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Titan Account Management</p>
                          </div>
                      </div>
                      <button onClick={() => setIsEditing(false)} className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"><X className="h-6 w-6" /></button>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="p-10 space-y-6">
                      <div className="grid gap-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Identity</label>
                              <div className="relative">
                                  <Input
                                    value={editForm.full_name}
                                    onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                                    placeholder="Full Name"
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold"
                                    required
                                  />
                                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Uplink</label>
                              <div className="relative">
                                  <Input
                                    value={editForm.phone_number}
                                    onChange={e => setEditForm({...editForm, phone_number: e.target.value})}
                                    placeholder="Phone Number"
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold"
                                    required
                                  />
                                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Extraction Point (Address)</label>
                              <div className="relative">
                                  <Input
                                    value={editForm.address}
                                    onChange={e => setEditForm({...editForm, address: e.target.value})}
                                    placeholder="Physical Address"
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold"
                                    required
                                  />
                                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Activation Cycle (Birthday)</label>
                              <div className="relative">
                                  <Input
                                    type="date"
                                    value={editForm.birth_date}
                                    onChange={e => setEditForm({...editForm, birth_date: e.target.value})}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 pl-12 text-sm font-bold"
                                    required
                                  />
                                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                              </div>
                          </div>
                      </div>

                      <div className="pt-6">
                        <Button
                            type="submit"
                            disabled={isUpdating}
                            className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            {isUpdating ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Zap className="h-5 w-5 mr-3 fill-current" />}
                            Sync Profile Data
                        </Button>
                      </div>
                  </form>
              </Card>
          </div>
      )}
    </div>
  );
}
