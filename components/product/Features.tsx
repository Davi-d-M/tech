import { Card, CardContent } from "@/components/ui/card";
import { Shield, Truck, Lock } from "lucide-react";

export default function Features() {
  const features = [
    { icon: Truck, title: "Fast Shipping", desc: "Reliable local delivery" },
    { icon: Shield, title: "Authentic", desc: "100% genuine guaranteed" },
    { icon: Lock, title: "Final Sale", desc: "No returns or exchanges" },
  ];
  return (
    <Card className="mb-16">
      <CardContent className="p-8">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-1">
                  {feature.title}
                </h2>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
