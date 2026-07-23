"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabaseClient";
import { formatPrice } from "@/lib/utils";
import { ArrowLeft, CreditCard, Shield, Truck, Smartphone } from "lucide-react";
import Link from "next/link";

interface CheckoutStatus {
  type: "idle" | "success" | "error";
  message: string;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"M-Pesa" | "COD">("M-Pesa");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>({
    type: "idle",
    message: "",
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = async () => {
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
    setCheckoutStatus({ type: "idle", message: "" });

    try {
      const orderRows = cart.map((item) => ({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        product_id: item.id, // Updated from shoe_id for tech context
        quantity: item.quantity,
        total_price: item.price * item.quantity,
        status: "Pending",
        payment_method: paymentMethod,
      }));

      const { error } = await supabase.from("orders").insert(orderRows);

      if (error) {
        console.error("Supabase insert error:", error.message);

        // Fallback for product_id column
        if (error.message.includes('product_id')) {
            const fallbackRows = cart.map((item) => ({
                customer_name: customerName.trim(),
                customer_phone: customerPhone.trim(),
                shoe_id: item.id,
                quantity: item.quantity,
                total_price: item.price * item.quantity,
                status: "Pending",
                payment_method: paymentMethod,
            }));
            const retry = await supabase.from("orders").insert(fallbackRows);
            if (!retry.error) {
                clearCart();
                setCheckoutStatus({ type: "success", message: "Order placed successfully! We will contact you shortly." });
                return;
            }
        }
        throw error;
      }

      clearCart();
      setCustomerName("");
      setCustomerPhone("");
      setCheckoutStatus({
        type: "success",
        message: "Order placed successfully! We will contact you shortly to confirm delivery.",
      });
    } catch (error: any) {
      console.error("Order error:", error);
      setCheckoutStatus({
        type: "error",
        message: error.message || "Something went wrong while saving your order.",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0 && checkoutStatus.type !== "success") {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter">Your Cart is Empty</h1>
        <p className="mt-4 text-slate-500 font-medium text-left mx-auto max-w-sm">Add some tech to your bag before checking out.</p>
        <Button className="mt-8 rounded-2xl px-10 py-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20" asChild>
          <Link href="/">Browse Gadgets</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl text-left">
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-8 text-left">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Checkout</h1>
          <p className="mt-2 text-slate-500 font-medium italic text-left">Complete your order details below.</p>
        </div>

        <Link href="/cart" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Edit Bag
        </Link>
      </div>

      <div className="grid gap-12 lg:grid-cols-3 text-left">
        <div className="space-y-8 lg:col-span-2 text-left">
          {/* Customer Card */}
          <Card className="rounded-3xl border-none shadow-sm bg-slate-50 p-2">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-800 text-left">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Smartphone className="h-4 w-4" /></div>
                Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-left">
              <div className="grid gap-4 sm:grid-cols-2 text-left">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Full Name</label>
                  <Input
                    placeholder="e.g. John Doe"
                    className="rounded-2xl border-none bg-white py-6"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isPlacingOrder}
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Phone Number</label>
                  <Input
                    placeholder="0712345678"
                    className="rounded-2xl border-none bg-white py-6"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={isPlacingOrder}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Card */}
          <Card className="rounded-3xl border-none shadow-sm bg-slate-50 p-2 text-left">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-slate-800 text-left">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><CreditCard className="h-4 w-4" /></div>
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-left">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <button
                    onClick={() => setPaymentMethod("M-Pesa")}
                    className={`p-6 rounded-[1.5rem] border-2 text-left transition-all duration-200 ${paymentMethod === 'M-Pesa' ? 'border-primary bg-white shadow-lg' : 'border-transparent bg-slate-100/50 opacity-60 hover:opacity-100'}`}
                  >
                    <p className="font-black uppercase tracking-tighter text-slate-900 text-lg">M-Pesa</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Instant confirmation</p>
                  </button>

                  <button
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-6 rounded-[1.5rem] border-2 text-left transition-all duration-200 ${paymentMethod === 'COD' ? 'border-primary bg-white shadow-lg' : 'border-transparent bg-slate-100/50 opacity-60 hover:opacity-100'}`}
                  >
                    <p className="font-black uppercase tracking-tighter text-slate-900 text-lg text-left">Cash on Delivery</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 text-left">Pay to Rider</p>
                  </button>
               </div>
            </CardContent>
          </Card>

          {checkoutStatus.type === 'success' && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-10 text-center animate-in zoom-in-95 duration-300">
                  <div className="h-16 w-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">✓</div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-emerald-900 mb-2">Order Confirmed!</h3>
                  <p className="text-emerald-700 font-medium mb-8 text-center">{checkoutStatus.message}</p>
                  <Button className="rounded-2xl px-8" asChild><Link href="/">Continue Shopping</Link></Button>
              </div>
          )}
        </div>

        <div className="space-y-6 text-left">
          <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-6 sticky top-8 text-left">
            <CardHeader className="px-0 pb-6 border-b border-white/10 text-left">
              <CardTitle className="text-xl font-black uppercase tracking-widest text-primary text-left">Summary</CardTitle>
            </CardHeader>
            <CardContent className="px-0 py-8 space-y-6 text-left">
              <div className="space-y-4 text-left">
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-slate-400">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-slate-400 text-left">
                  <span>Delivery</span>
                  <span className="text-emerald-400">FREE</span>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="flex justify-between text-2xl font-black uppercase tracking-tighter text-left">
                <span>Total</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>

              <Button
                size="lg"
                className="w-full bg-white text-slate-900 hover:bg-slate-100 py-8 rounded-[1.5rem] font-black uppercase tracking-widest text-xs mt-8 shadow-2xl disabled:bg-slate-700"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || checkoutStatus.type === 'success'}
              >
                {isPlacingOrder ? "Processing..." : paymentMethod === 'COD' ? "Confirm COD Order" : "Place Order"}
              </Button>

              {checkoutStatus.type === 'error' && (
                <p className="bg-rose-500/20 text-rose-200 p-4 rounded-2xl text-xs font-bold mt-4 border border-rose-500/30 text-center">
                  ⚠️ {checkoutStatus.message}
                </p>
              )}

              <div className="space-y-4 pt-8 text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">
                <div className="flex items-center gap-3 text-left">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>Secure Local Processing</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Nairobi Fast Dispatch</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
