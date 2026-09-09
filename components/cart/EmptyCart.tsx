import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/useSettings";
import { Shield, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";

export default function EmptyCart() {
  const { settings } = useSettings();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-32 text-left">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8 text-center flex flex-col items-center">
          <ShoppingBag className="h-24 w-24 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">
            Your cart is empty
          </h1>
          <p className="text-slate-400 text-lg font-medium italic mt-2">
            Looks like you haven&apos;t added anything to your extraction list yet.
          </p>
        </div>

        <div className="space-y-8 flex flex-col items-center">
          <Button
            asChild
            size="lg"
            className="bg-primary text-white hover:bg-primary/90 rounded-2xl h-16 px-12 font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 active:scale-95 transition-all"
          >
            <Link href="/">Continue Shopping</Link>
          </Button>

          <div className="flex items-center justify-center gap-10">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {settings?.shipping?.free_shipping_message || "Free shipping over KSh 5,000"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Secure checkout
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
