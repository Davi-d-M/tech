"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Shield,
} from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      details: ["hello@apexstores.com", "support@apexstores.com"],
      description: "Send us an email anytime",
    },
    {
      icon: Phone,
      title: "Call Us",
      details: ["+254142422908", "+254142422908"],
      description: "Mon-Fri from 8am to 5pm",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      details: ["Tom Mboya Street", "Nairobi City, Kenya"],
      description: "Come say hello at our office",
    },
    {
      icon: Clock,
      title: "Working Hours",
      details: ["Monday - Friday: 9am - 6pm", "Saturday: 10am - 4pm"],
      description: "Sunday: Closed",
    },
  ];

  const features = [
    {
      icon: Headphones,
      title: "Tech Support",
      description: "Assistance with all gadget setups",
    },
    {
      icon: MessageSquare,
      title: "Quick Response",
      description: "We reply within 2 hours",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your information is safe with us",
    },
  ];

  return (
    <div className="bg-background text-left">
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-6 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px]">
              Support Hub
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-black text-foreground mb-6 uppercase tracking-tighter">
              Get in touch with{" "}
              <span className="text-primary block lg:inline">
                our tech team
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Have a question about a product, compatibility, or your order? We're here to help you get the best out of your tech.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 text-left">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12 text-left">
            <div className="lg:col-span-2 text-left">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-50 p-8">
                  <CardTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
                    Send us a message
                  </CardTitle>
                  <p className="text-slate-500 font-medium text-sm mt-1">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2 text-left">
                        <label
                          htmlFor="name"
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                          Your Name
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="bg-background border-slate-100 py-6 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <label
                          htmlFor="email"
                          className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                        >
                          Your Email
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="your@gmail.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="bg-background border-slate-100 py-6 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <label
                        htmlFor="subject"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        Subject
                      </label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="How can we help you?"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="bg-background border-slate-100 py-6 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 text-left">
                      <label
                        htmlFor="message"
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400"
                      >
                        Your Message
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us more about your question or concern..."
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        className="bg-background border-slate-100 rounded-xl resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || isSubmitted}
                      className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </div>
                      ) : isSubmitted ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Message Sent!
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Send Message
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8 text-left">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-2 bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-800">
                    Contact Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm">
                        <info.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-tight">
                          {info.title}
                        </h3>
                        {info.details.map((detail, idx) => (
                          <p
                            key={idx}
                            className="text-sm text-slate-500 font-medium"
                          >
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-2">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-slate-800">
                    Why us?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  {features.map((feature, index) => (
                    <div key={index}>
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                          <feature.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">
                            {feature.title}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      {index < features.length - 1 && (
                        <Separator className="mt-4 border-slate-50" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-white text-slate-900 border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[10px]">
              FAQ
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-slate-900">
              Common Questions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
            {[
              {
                question: "Are your gadgets authentic?",
                answer:
                  "Yes, we strictly deal in 100% authentic tech products. All chargers, AirPods, and accessories come in their original manufacturer packaging.",
              },
              {
                question: "How long does delivery take?",
                answer:
                  "Nairobi deliveries are usually within 24 hours. For upcountry orders, we dispatch via regional parcel services which typically take 2-3 business days.",
              },
              {
                question: "Do you offer warranties?",
                answer:
                  "All our electronic items undergo technical testing before dispatch to ensure zero defects upon delivery. Specific manufacturer warranties apply to select premium items.",
              },
              {
                question: "What is the return policy?",
                answer:
                  "To maintain product integrity and security, all sales are final. We encourage customers to verify device compatibility before placing an order.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8 hover:bg-slate-100 transition-colors shadow-sm">
                  <h3 className="font-black text-primary text-lg uppercase tracking-tight mb-4">
                    {faq.question}
                  </h3>
                  <p className="text-slate-600 font-medium leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white text-left">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-[3rem] p-12 lg:p-20 text-center shadow-2xl shadow-primary/20">
              <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tighter">
                Still have questions?
              </h2>
              <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-medium">
                Our technical support team is ready to assist you with any gadget compatibility or order inquiries.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="h-16 px-10 rounded-2xl bg-white text-primary hover:bg-slate-50 font-black uppercase tracking-widest text-xs shadow-xl shadow-black/10"
                  asChild
                >
                    <a href="tel:+254142422908">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Us Now
                    </a>
                </Button>

                <Button className="h-16 px-10 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20" asChild>
                    <a href="https://wa.me/254142422908" target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat on WhatsApp
                    </a>
                </Button>
              </div>
          </div>
        </div>
      </section>
    </div>
  );
}
