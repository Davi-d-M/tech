"use client";

import { useState, useEffect, Suspense } from "react";
import { type User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { formatPrice, cn } from "@/lib/utils";
import { validateCoupon } from "@/lib/couponService";
import { runPostCheckoutAudit } from "@/lib/achievementService";
import { ArrowLeft, CreditCard, Shield, Truck, Smartphone, Loader2, MapPin, Tag, CheckCircle2, Zap, UserPlus, PartyPopper, Link2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useSettings } from "@/lib/useSettings";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/profile/LocationPicker"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 z-[400] bg-white/70 backdrop-blur-xl flex items-center justify-center"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
});

interface CheckoutStatus {
  type: "idle" | "success" | "error" | "processing";
  message: string;
}

interface Coupon {
  code: string;
  discount_percent: number;
}

interface DBProduct {
  id: number;
  name: string;
  stock: number;
  variant_stock: Record<string, number> | null;
  cost_price: number;
}

interface OrderPayload {
  user_id: string | null;
  session_id: string | null; // NEW: Session Isolation
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  product_id: number;
  quantity: number;
  size: string;
  unit_price: number;
  unit_cost: number;
  total_price: number;
  status: string;
  payment_method: string;
  checkout_request_id: string | null;
  referred_by_code: string | null;
  captured_by: string;
  latitude?: number | null;
  longitude?: number | null;
  note?: string;
}

type SanitizedOrderPayload = Omit<OrderPayload, 'note' | 'referred_by_code'>;

interface PaystackResponse {
  status: string;
  reference: string;
  transaction: string;
  message: string;
  redirecturl?: string;
}

declare global {
  interface Window {
    fbq?: (action: string, eventName: string, params?: Record<string, unknown>) => void;
    PaystackPop: {
      setup: (options: Record<string, unknown>) => {
        openIframe: () => void;
      };
    };
  }
}


function CheckoutContent() {
  const { cart, clearCart } = useCart();
  const { settings } = useSettings();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"M-Pesa" | "COD">("M-Pesa");
  const [shippingRegionId, setShippingRegionId] = useState('nairobi-cbd');
  const [couponCode, setCouponCode] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [isRestoredBonus, setIsRestoredBonus] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ latitude?: number, longitude?: number } | null>(null);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>({
    type: "idle",
    message: "",
  });
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [isSystemLockdown, setIsSystemLockdown] = useState(false);

  useEffect(() => {
    async function checkLockdown() {
        if (!supabase) return;
        const { data } = await supabase.from('settings').select('value').eq('key', 'system_lockdown').maybeSingle();
        const val = data?.value as any;
        if (val?.active) {
            setIsSystemLockdown(true);
        }
    }
    checkLockdown();
  }, []);

  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Clear status when switching payment methods
  useEffect(() => {
    setCheckoutStatus({ type: "idle", message: "" });
  }, [paymentMethod]);

  useEffect(() => {
    const urlRef = searchParams.get('ref');
    const sessionRef = sessionStorage.getItem('apex_referral_code');

    let cookieRef = null;
    if (typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )apex_referral_code=([^;]+)'));
        if (match) cookieRef = match[2];
    }

    setReferralCode(urlRef || sessionRef || cookieRef);
  }, [searchParams]);

  // 0. Load Profile & Loyalty Points
  useEffect(() => {
    async function loadProfile() {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setUser(session.user);
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (profileData) {
                setLoyaltyPoints(profileData.loyalty_points || 0);
                setProfile(profileData);
                // Auto-fill details
                setCustomerName(profileData.full_name || "");
                setCustomerPhone(profileData.phone_number || "");
                setCustomerEmail(session.user.email || "");
                // Sync GPS
                if (profileData.latitude && profileData.longitude) {
                    setCoords({ lat: profileData.latitude, lng: profileData.longitude });
                }
            }
        }

        // Check for restored bonus from profile
        if (typeof window !== 'undefined') {
            setIsRestoredBonus(localStorage.getItem('apex_restored_bonus') === 'true');
        }
    }
    loadProfile();
  }, []);

  const regions = [
    { id: 'nairobi-cbd', label: settings.shipping.nairobi_cbd_label, fee: settings.shipping.nairobi_cbd },
    { id: 'nairobi-outskirts', label: settings.shipping.nairobi_outskirts_label, fee: settings.shipping.nairobi_outskirts },
    { id: 'upcountry', label: settings.shipping.upcountry_label, fee: settings.shipping.upcountry },
  ];

  const currentRegion = regions.find(r => r.id === shippingRegionId) || regions[0];

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = activeCoupon ? (subtotal * activeCoupon.discount_percent) / 100 : 0;
  const pointsDiscount = usePoints ? Math.min(subtotal - discount, loyaltyPoints / 10) : 0;
  const totalSavings = discount + pointsDiscount;
  const originalTotal = subtotal + currentRegion.fee;
  const total = originalTotal - totalSavings;

  // 1. Abandoned Cart Recovery Logic
  useEffect(() => {
    const syncAbandonedCart = async () => {
        if (!supabase || cart.length === 0) return;
        if (!customerName.trim() || !customerPhone.trim()) return;

        const sessionId = localStorage.getItem('apex_session_id');

        try {
            await supabase.from('abandoned_carts').upsert({
                customer_name: customerName.trim(),
                customer_phone: customerPhone.trim(),
                cart_items: cart,
                total_price: total,
                session_id: sessionId,
                updated_at: new Date().toISOString(),
                recovery_status: 'Waiting'
            }, { onConflict: 'customer_phone' });
        } catch (err) {
            console.warn("Abandoned cart sync issue:", err);
        }
    };

    const timer = setTimeout(syncAbandonedCart, 5000); // Sync after 5s of typing
    return () => clearTimeout(timer);
  }, [customerName, customerPhone, cart, total]);

  // 1.5 Realtime "Magic" Checkout Listener
  useEffect(() => {
    if (!supabase || !placedOrderId) return;

    const channel = supabase
        .channel('order-status-magic')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${placedOrderId}`,
            },
            (payload) => {
                const newStatus = payload.new.status;
                if (newStatus === 'Paid') {
                    setCheckoutStatus({
                        type: "success",
                        message: "Payment Received! Your order is now being processed."
                    });
                }
            }
        )
        .subscribe();

    return () => {
        if (supabase) {
            supabase.removeChannel(channel);
        }
    };
  }, [placedOrderId]);

  const handleApplyCoupon = async () => {
      if (!couponCode.trim()) return;
      setIsValidatingCoupon(true);
      const coupon = await validateCoupon(couponCode);
      if (coupon) {
          setActiveCoupon(coupon);
      } else {
          alert("Invalid or expired coupon code.");
      }
      setIsValidatingCoupon(false);
  };

  const handlePlaceOrder = async () => {
    if (isSystemLockdown) {
        setCheckoutStatus({
            type: "error",
            message: "Tactical Pause: Order intake is temporarily suspended for system maintenance. Please try again in a few minutes."
        });
        return;
    }
    if (!supabase) {
      setCheckoutStatus({
        type: "error",
        message: "Database not connected. Unable to save order.",
      });
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setCheckoutStatus({
        type: "error",
        message: "Enter your full name and phone number before placing the order.",
      });
      return;
    }

    setIsPlacingOrder(true);
    setCheckoutStatus({ type: "processing", message: "Verifying tech availability..." });

    try {
      const client = supabase;
      if (!client) return;
      // 0.5 Smart Stock Guard: Final real-time check
      let dbProducts: DBProduct[] = [];
      const productIds = cart.map(item => item.id);
      const { data } = await client
          .from('products')
          .select('id, name, stock, variant_stock, cost_price')
          .in('id', productIds);
      dbProducts = (data as unknown as DBProduct[]) || [];

      if (dbProducts.length > 0) {
          for (const item of cart) {
              const dbProd = dbProducts.find(p => p.id === item.id);
              if (!dbProd) continue;

              const vStock = dbProd.variant_stock?.[item.size || 'Standard'] ?? dbProd.stock;
              if (vStock < item.quantity) {
                  setCheckoutStatus({
                      type: "error",
                      message: `Sorry, ${dbProd.name} (${item.size || 'Standard'}) just sold out or has insufficient stock! Please remove it from your cart.`
                  });
                  setIsPlacingOrder(false);
                  return;
              }
          }
      }

      const checkoutRequestId = `APEX-ref-${Date.now()}`;

      if (paymentMethod === "M-Pesa") {
        // 1. Save order as Pending first (Persistence)
        const orderId = await saveOrder(checkoutRequestId, dbProducts);
        if (!orderId) return;

        // 2. Launch Paystack
        if (!window.PaystackPop) {
            setCheckoutStatus({ type: "error", message: "Payment system failing to load. Please check your connection." });
            setIsPlacingOrder(false);
            return;
        }

        setCheckoutStatus({ type: "processing", message: "Launching secure payment window..." });

        const handler = window.PaystackPop.setup({
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_live_0cf2e82a868e445c53ee0b61b5045360b96c75a5',
            email: customerEmail || 'member@apexstores.com',
            amount: Math.round(total * 100), // KES to Cents
            currency: 'KES',
            ref: checkoutRequestId,
            callback: async (response: PaystackResponse) => {
                if (response.status === 'success' && supabase) {
                    await supabase.from('orders').update({
                        status: 'Paid',
                        payment_verified_at: new Date().toISOString(),
                        note: `Paystack Ref: ${response.reference}`
                    }).eq('checkout_request_id', checkoutRequestId);

                    // FORCE REDIRECT - prevent being stuck in Paystack modal
                    window.location.href = `/checkout/success?orderId=${orderId}`;
                }
            },
            onClose: async () => {
                setIsPlacingOrder(false);

                // Mark order as Failed in DB for accurate analytics
                if (supabase && orderId) {
                    const { data: currentOrder } = await supabase.from('orders').select('status').eq('id', orderId).single();
                    if (currentOrder?.status === 'Pending') {
                        await supabase.from('orders').update({
                            status: 'Payment Failed',
                            note: 'Transaction cancelled by user (Window Closed)'
                        }).eq('id', orderId);
                    }
                }

                setCheckoutStatus({
                    type: "error",
                    message: "Payment process was interrupted. Please re-initiate payment to secure your order."
                });
            }
        });

        handler.openIframe();
      } else {
        // COD - Save immediately
        const orderId = await saveOrder(null, dbProducts);
        if (orderId) finalizeOrder(orderId);
      }
    } catch (error: unknown) {
        const err = error as Error;
        console.error("Checkout Error:", err);
        setCheckoutStatus({ type: "error", message: err.message || "An unexpected error occurred." });
        setIsPlacingOrder(false);
    }
  };

  const saveOrder = async (requestId: string | null, products: DBProduct[]) => {
    const client = supabase;
    if (!client) return null;
    try {
      setCheckoutStatus({ type: "processing", message: "Synchronizing payload with database..." });

      const sessionId = localStorage.getItem('apex_session_id');

      // 1. Create Master Order (Header)
      const headerPayload = {
          user_id: user?.id || null,
          session_id: sessionId,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || null,
          total_price: total,
          delivery_cost: currentRegion.fee,
          status: "Pending",
          payment_method: paymentMethod === 'M-Pesa' ? 'Paystack' : paymentMethod,
          checkout_request_id: requestId,
          referred_by_code: referralCode,
          captured_by: 'system',
          latitude: coords.lat || profile?.latitude || null,
          longitude: coords.lng || profile?.longitude || null,
          note: `Region: ${currentRegion.label}${activeCoupon ? ` | Coupon: ${activeCoupon.code}` : ''}${usePoints ? ` | Used ${pointsDiscount * 10} points` : ''}${referralCode ? ` | Referred by ${referralCode}` : ''}`
      };

      const { data: headerData, error: headerError } = await client
          .from("orders")
          .insert([headerPayload])
          .select('id')
          .single();

      if (headerError) {
          console.error("Header Save Error:", headerError);
          // Silent retry with sanitized payload if columns missing
          const { data: retryData, error: retryError } = await client
              .from("orders")
              .insert([{
                  customer_name: customerName.trim(),
                  customer_phone: customerPhone.trim(),
                  total_price: total,
                  status: "Pending"
              }])
              .select('id')
              .single();

          if (retryError) throw retryError;
          if (retryData) {
              await createOrderItems(retryData.id, products);
              setPlacedOrderId(retryData.id);
              return retryData.id;
          }
      } else if (headerData) {
          await createOrderItems(headerData.id, products);
          setPlacedOrderId(headerData.id);
          return headerData.id;
      }

      return null;
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Order save error:", err);
      throw err;
    }
  };

  const createOrderItems = async (orderId: number, products: DBProduct[]) => {
      if (!supabase) return;
      const itemRows = cart.map(item => {
          const dbProd = products?.find(p => p.id === item.id);
          return {
              order_id: orderId,
              product_id: item.id,
              quantity: item.quantity,
              unit_price: item.price,
              unit_cost: dbProd?.cost_price || 0,
              size: item.size || 'Standard',
              status: 'Pending'
          };
      });

      const { error } = await supabase.from("order_items").insert(itemRows);
      if (error) {
          console.warn("Item save warning (falling back to legacy single-row mode):", error);
          // If order_items table doesn't exist yet, we've already saved the header
          // but we might need to link the product_id to the header for legacy support
          if (cart.length > 0) {
              await supabase.from('orders').update({ product_id: cart[0].id }).eq('id', orderId);
          }
      }
  };

  const finalizeOrder = async (orderId?: number) => {
    const finalId = orderId || placedOrderId;

    // Meta Tracking: Purchase
    if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
            value: total,
            currency: 'KES',
            content_ids: cart.map(item => item.id),
            content_type: 'product'
        });
    }

    // 1. Update Loyalty Points & Referral Bonuses
    const client = supabase;
    if (user && client) {
        try {
            let finalPoints = loyaltyPoints;
            const pointDetails: { profile_id: string, amount: number, description: string }[] = [];

            if (usePoints) {
                const pointsUsed = pointsDiscount * 10;
                finalPoints -= pointsUsed;
                pointDetails.push({ profile_id: user.id, amount: -pointsUsed, description: `Used at Checkout` });
            }

            // Award new points (5% of total paid)
            const earned = Math.floor(total * 0.05);
            finalPoints += earned;
            pointDetails.push({ profile_id: user.id, amount: earned, description: `Earned from Order` });

            // Referral Bonus
            if (referralCode) {
                finalPoints += 100;
                pointDetails.push({ profile_id: user.id, amount: 100, description: `Referral Welcome Bonus` });

                const { data: referrer } = await client.from('profiles').select('id, loyalty_points, total_commission_earned').eq('referral_code', referralCode).single();
                if (referrer) {
                    await client.from('profiles').update({ loyalty_points: (referrer.loyalty_points || 0) + 100 }).eq('id', referrer.id);
                    await client.from('loyalty_ledger').insert([{ profile_id: referrer.id, amount: 100, description: `Referral Award (Friend Join)` }]);
                    const commission = Math.floor(total * 0.05);
                    await client.from('profiles').update({ total_commission_earned: (referrer.total_commission_earned || 0) + commission }).eq('id', referrer.id);
                }
            }

            if (isRestoredBonus) {
                finalPoints += 50;
                pointDetails.push({ profile_id: user.id, amount: 50, description: `Welcome Back Bonus (Restored Bag)` });
                localStorage.removeItem('apex_restored_bonus');
            }

            await client.from('profiles').update({ loyalty_points: finalPoints }).eq('id', user.id);
            if (pointDetails.length > 0) {
                await client.from('loyalty_ledger').insert(pointDetails);
            }

            // Grant Achievements
            await runPostCheckoutAudit(user.id, total);

            // 1.5 Update Mission Progress
            try {
                const { data: { session } } = await client.auth.getSession();
                // Buy Accessory Mission
                await fetch('/api/member/gamification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': session ? `Bearer ${session.access_token}` : ''
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        action: 'update-mission-progress',
                        payload: { missionType: 'buy-accessory', increment: 1 }
                    }),
                });

                // Refer Friend Mission for the Referrer
                if (referralCode) {
                    const { data: referrer } = await client.from('profiles').select('id').eq('referral_code', referralCode).single();
                    if (referrer) {
                        await fetch('/api/member/gamification', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': session ? `Bearer ${session.access_token}` : ''
                            },
                            body: JSON.stringify({
                                userId: referrer.id,
                                action: 'update-mission-progress',
                                payload: { missionType: 'refer-friend', increment: 1 }
                            }),
                        });
                    }
                }
            } catch (err) {
                console.warn("Mission tracking failed", err);
            }
        } catch (err) {
            console.error("Loyalty update error:", err);
        }
    }

    // 2. Clear abandoned record on success
    if (client && customerPhone) {
        await client.from('abandoned_carts').delete().eq('customer_phone', customerPhone);
    }

    clearCart();
    setCustomerName("");
    setCustomerPhone("");

    // Redirect to success page if we have a placed order ID
    if (finalId) {
        window.location.href = `/checkout/success?orderId=${finalId}`;
    } else {
        setCheckoutStatus({
            type: "success",
            message: paymentMethod === "M-Pesa"
              ? "Order received! Please complete the PIN prompt on your phone."
              : "Order placed successfully! We will contact you shortly to confirm delivery.",
        });
    }
  };

  if (cart.length === 0 && checkoutStatus.type !== "success") {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter">Your Cart is Empty</h1>
        <p className="mt-4 text-slate-500 font-medium text-left mx-auto max-w-sm italic">Add some tech to your bag before checking out.</p>
        <Button className="mt-8 rounded-2xl px-12 h-16 font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20" asChild>
          <Link href="/">Browse Gadgets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl text-left min-h-screen">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      {isPickingLocation && (
          <LocationPicker
            initialLat={coords.lat || undefined}
            initialLng={coords.lng || undefined}
            onConfirm={(lat, lng) => {
                setCoords({ lat, lng });
                setIsPickingLocation(false);
            }}
            onClose={() => setIsPickingLocation(false)}
          />
      )}
      <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-100 pb-10">
        <div>
            <Link href="/cart" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" /> Edit Cart
            </Link>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground">Checkout</h1>
            <p className="mt-2 text-slate-500 font-medium italic">Complete your order to begin dispatch.</p>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">

          {/* Customer Info */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Smartphone className="h-5 w-5" /></div>
                    <h2 className="text-xl font-black uppercase tracking-tighter">Customer Details</h2>
                </div>
                {referralCode && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 animate-bounce">
                        <UserPlus className="h-3 w-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Referral Bonus Applied</span>
                    </div>
                )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
                  <Input placeholder="John Doe" className="rounded-2xl border-slate-100 bg-slate-50/50 h-14" value={customerName} onChange={(e) => setCustomerName(e.target.value)} disabled={isPlacingOrder} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Phone Number</label>
                  <Input placeholder="07XXXXXXXX" className="rounded-2xl border-slate-100 bg-slate-50/50 h-14" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} disabled={isPlacingOrder} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address (For PDF Receipt)</label>
                  <Input type="email" placeholder="you@example.com" className="rounded-2xl border-slate-100 bg-slate-50/50 h-14" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} disabled={isPlacingOrder} />
                </div>
            </div>
          </section>

          {/* Shipping Calculator */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><MapPin className="h-5 w-5" /></div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Delivery Region</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                {regions.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => setShippingRegionId(r.id)}
                        className={`p-4 sm:p-6 rounded-3xl border-2 text-left transition-all active:scale-95 ${currentRegion.id === r.id ? 'border-primary bg-white shadow-xl scale-105' : 'border-slate-50 bg-slate-50/50 opacity-60 hover:opacity-100'}`}
                    >
                        <p className="font-black uppercase tracking-tight text-foreground text-[10px] sm:text-sm">{r.label}</p>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-1">{r.fee === 0 ? 'FREE' : `+ Ksh ${r.fee}`}</p>
                    </button>
                ))}
            </div>
          </section>

          {/* 📍 TACTICAL DROP POINT (GPS PINPOINT) */}
          <section className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Zap className="h-4 w-4 sm:h-5 sm:w-5" /></div>
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter">Tactical Drop Point</h2>
            </div>
            <Card
                onClick={() => setIsPickingLocation(true)}
                className={cn(
                    "p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-2 transition-all cursor-pointer group relative overflow-hidden",
                    coords.lat ? "border-emerald-100 bg-emerald-50/30" : "border-slate-50 bg-slate-50/50 hover:border-primary/20"
                )}
            >
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                    <div className="text-left space-y-2 w-full sm:w-auto">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500",
                                coords.lat ? "bg-emerald-500 text-white animate-bounce" : "bg-white text-slate-300 group-hover:text-primary"
                            )}>
                                <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div>
                                <h3 className="font-black uppercase text-foreground tracking-tight text-xs sm:text-base">
                                    {coords.lat ? "Drop Point Locked" : "Pin Location"}
                                </h3>
                                <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {coords.lat ? `${coords.lat.toFixed(6)}, ${coords.lng?.toFixed(6)}` : "Click to open tactical map"}
                                </p>
                            </div>
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 leading-relaxed italic max-w-xs">
                            &quot;Initialize precision coordinates for zero-delay dispatch. Our rider will approach this exact pin.&quot;
                        </p>
                    </div>
                    <Button
                        type="button"
                        className={cn(
                            "w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest transition-all shadow-xl active:scale-95",
                            coords.lat ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                        )}
                    >
                        {coords.lat ? "Change Drop Point" : "Open Map Hub"}
                    </Button>
                </div>
                {/* Decoration */}
                <Zap className="absolute -bottom-6 -right-6 h-20 w-20 sm:h-24 sm:w-24 text-slate-100/50 rotate-12" />
            </Card>
          </section>

          {/* Payment Method */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><CreditCard className="h-5 w-5" /></div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Payment Mode</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => setPaymentMethod("M-Pesa")} className={`p-6 rounded-3xl border-2 text-left transition-all ${paymentMethod === 'M-Pesa' ? 'border-primary bg-white shadow-xl' : 'border-slate-50 bg-slate-50/50 opacity-60 hover:opacity-100'}`}>
                    <p className="font-black uppercase tracking-tight text-foreground text-lg">M-Pesa</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Direct STK Push</p>
                  </button>

                  <button onClick={() => setPaymentMethod("COD")} className={`p-6 rounded-3xl border-2 text-left transition-all ${paymentMethod === 'COD' ? 'border-primary bg-white shadow-xl' : 'border-slate-50 bg-slate-50/50 opacity-60 hover:opacity-100'}`}>
                    <p className="font-black uppercase tracking-tight text-foreground text-lg">Cash on Delivery</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Pay to Rider</p>
                  </button>
            </div>
          </section>

          {checkoutStatus.type === 'success' && (
              <div className="bg-white border-4 border-primary rounded-[3rem] p-12 text-center animate-in zoom-in-95 duration-700 shadow-2xl shadow-primary/20 relative overflow-hidden">
                  <div className="relative z-10">
                      <div className="h-24 w-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
                        <PartyPopper className="h-12 w-12" />
                      </div>
                      <h3 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-4">Payment Verified!</h3>
                      <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed text-lg">
                          Your order has been confirmed. We&apos;ve sent a professional receipt to your email.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Link href={`/track?id=${placedOrderId}`} className="flex-1">
                            <Button className="w-full rounded-2xl h-16 bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">Track Dispatch</Button>
                          </Link>
                          <Button
                            variant="outline"
                            className="flex-1 rounded-2xl h-16 border-2 font-black uppercase text-xs tracking-widest text-primary border-primary/10 hover:bg-primary/5 transition-all hover:scale-105 active:scale-95"
                            onClick={() => {
                                const link = `${window.location.origin}/track?id=${placedOrderId}`;
                                const message = `Hello! I just placed an order on Apexstores. Track my order here: ${link}`;
                                window.open(`https://wa.me/${settings.contact.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                          >
                              <MessageSquare className="h-4 w-4 mr-2" /> Share on WhatsApp
                          </Button>
                      </div>
                      <div className="mt-4 flex justify-center gap-4">
                          <button
                            onClick={() => {
                                const link = `${window.location.origin}/track?id=${placedOrderId}`;
                                navigator.clipboard.writeText(link);
                                alert("Tracking link copied!");
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-1"
                          >
                             <Link2 className="h-3 w-3" /> Copy Link
                          </button>
                          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                              ← Back to Store
                          </Link>
                      </div>
                  </div>
                  {/* Confetti-like background decor */}
                  <div className="absolute top-0 left-10 w-4 h-4 bg-primary rounded-full animate-ping opacity-20"></div>
                  <div className="absolute bottom-10 right-20 w-6 h-6 bg-indigo-500 rounded-full animate-bounce opacity-20"></div>
              </div>
          )}
        </div>

        <div className="space-y-8 lg:sticky lg:top-8">

          {/* Order Summary Card */}
          <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-50 text-foreground p-2">
            <CardHeader className="p-8 border-b border-slate-100">
              <CardTitle className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
                  <Tag className="h-5 w-5" /> Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>Delivery ({currentRegion.id})</span>
                  <span className="text-primary">{currentRegion.fee === 0 ? 'FREE' : formatPrice(currentRegion.fee)}</span>
                </div>
                {activeCoupon && (
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-50 p-2 rounded-lg">
                        <span>Discount ({activeCoupon.code})</span>
                        <span>-{formatPrice(discount)}</span>
                    </div>
                )}
                {usePoints && (
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                        <span>Apex Points Redempton</span>
                        <span>-{formatPrice(pointsDiscount)}</span>
                    </div>
                )}
                {totalSavings > 0 && (
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-primary bg-primary/5 p-3 rounded-xl border border-primary/10 animate-pulse">
                        <span className="flex items-center gap-2"><Zap className="h-3 w-3 fill-current" /> Total Savings</span>
                        <span>{formatPrice(totalSavings)}</span>
                    </div>
                )}
              </div>

              <Separator className="bg-slate-200" />

              <div className="flex justify-between items-end">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Grand Total</span>
                <div className="text-right">
                    {totalSavings > 0 && (
                        <p className="text-xs font-bold text-slate-300 line-through mb-1">{formatPrice(originalTotal)}</p>
                    )}
                    <span className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-primary animate-in fade-in zoom-in-95 duration-500" key={total}>
                        {formatPrice(total)}
                    </span>
                </div>
              </div>

              {/* Loyalty Redemption */}
              {loyaltyPoints > 0 && !activeCoupon && (
                  <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3 px-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Club Rewards</p>
                          <span className="text-[8px] font-bold text-slate-300 uppercase italic">10 Pts = 1 Ksh</span>
                      </div>
                      <button
                        onClick={() => setUsePoints(!usePoints)}
                        className={`w-full flex items-center justify-between p-5 rounded-[1.8rem] border-2 transition-all duration-500 ${usePoints ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                          <div className="flex items-center gap-4 text-left">
                              <div className={cn(
                                  "h-10 w-10 rounded-2xl flex items-center justify-center transition-all",
                                  usePoints ? "bg-primary text-white scale-110" : "bg-slate-50 text-slate-300"
                              )}>
                                  <Zap className="h-5 w-5 fill-current" />
                              </div>
                              <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">Redeem {loyaltyPoints.toLocaleString()} Points</p>
                                  <p className={cn("text-[9px] font-bold mt-1.5 uppercase tracking-tighter", usePoints ? "text-primary-foreground/60" : "text-primary")}>
                                      Save {formatPrice(loyaltyPoints / 10)} on this order
                                  </p>
                              </div>
                          </div>
                          <div className={cn(
                              "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                              usePoints ? "bg-primary border-primary" : "border-slate-100"
                          )}>
                              {usePoints && <CheckCircle2 className="h-4 w-4 text-white" />}
                          </div>
                      </button>
                  </div>
              )}

              {/* Coupon Box */}
              {!activeCoupon && (
                  <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3 px-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Coupon Code</p>
                          {typeof window !== 'undefined' && localStorage.getItem('apex_exit_intent') === 'true' && (
                              <button
                                onClick={() => {
                                    setCouponCode('STAY5');
                                    localStorage.removeItem('apex_exit_intent');
                                }}
                                className="text-[8px] font-black text-primary uppercase underline tracking-widest animate-pulse"
                              >
                                Apply &quot;STAY5&quot; (5% Off)
                              </button>
                          )}
                      </div>
                      <div className="flex gap-2">
                          <Input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="PROMO CODE"
                            className="h-12 rounded-2xl bg-white border-slate-100 text-xs font-black tracking-widest uppercase focus:ring-primary/10"
                          />
                          <Button
                            onClick={handleApplyCoupon}
                            disabled={isValidatingCoupon}
                            variant="outline"
                            className="h-12 rounded-2xl px-6 text-[10px] font-black uppercase border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
                          >
                            Apply
                          </Button>
                      </div>
                  </div>
              )}

              <Button
                size="lg"
                className="w-full h-20 bg-primary text-white hover:bg-primary/90 rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[11px] mt-4 shadow-2xl disabled:bg-slate-200 transition-all active:scale-95"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || checkoutStatus.type === 'success'}
              >
                {isPlacingOrder ? (
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Finalizing...
                    </div>
                ) : paymentMethod === 'COD' ? "Confirm COD Order" : "Initiate Payment"}
              </Button>

              {checkoutStatus.type === 'processing' && (
                <p className="bg-primary/5 text-primary p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mt-4 text-center animate-pulse">
                  ℹ️ {checkoutStatus.message}
                </p>
              )}

              {checkoutStatus.type === 'error' && (
                <div className="space-y-4 mt-4">
                    <div className="bg-rose-50 text-rose-600 p-6 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest text-center border border-rose-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <p className="mb-4">⚠️ {checkoutStatus.message}</p>
                      <div className="flex flex-col gap-2">
                          <Button
                            onClick={handlePlaceOrder}
                            className="h-12 rounded-xl bg-primary text-white font-black uppercase text-[9px] tracking-widest"
                          >
                              Retry M-Pesa Protocol
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => { setPaymentMethod("COD"); setCheckoutStatus({ type: "idle", message: "" }); }}
                            className="h-12 rounded-xl border-rose-200 text-rose-600 font-black uppercase text-[9px] tracking-widest"
                          >
                              Switch to Cash on Delivery
                          </Button>
                      </div>
                    </div>
                </div>
              )}

              <div className="space-y-4 pt-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>Secure M-Pesa Integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Nairobi Elite Dispatch</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center uppercase font-black text-slate-400">Loading Checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
