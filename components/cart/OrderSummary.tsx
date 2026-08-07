"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { CreditCard, Heart, Shield, Truck } from "lucide-react";
import Link from "next/link";

export default function OrderSummary() {
  const { cart } = useCart();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = 0;
  const tax = 0;
  const total = subtotal + shipping + tax;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({itemCount} items)
            </span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              <Badge variant="secondary" className="text-xs">
                Calculated at Checkout
              </Badge>
            </span>
          </div>

          <Separator />

          <div className="flex justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full bg-primary text-white hover:bg-primary/90 rounded-2xl h-16 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all"
          asChild
        >
          <Link href="/checkout" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Proceed to Checkout
          </Link>
        </Button>

        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
            <Shield className="h-4 w-4 text-primary" />
            <span>Secure Checkout Protected</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
            <Truck className="h-4 w-4 text-primary" />
            <span>Nairobi Fast Dispatch</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
            <Heart className="h-4 w-4 text-primary" />
            <span>100% Genuine Tech Verified</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
