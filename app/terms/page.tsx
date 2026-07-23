"use strict";
import React from "react";

export default function TermsAndConditionsPage() {
  const lastUpdated = "May 2026";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Header Header */}
        <div className="border-b pb-6 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Terms & Conditions</h1>
          <p className="text-sm text-slate-400 mt-2">Last Updated: {lastUpdated}</p>
          <p className="text-slate-600 mt-4 leading-relaxed font-medium">
            Welcome to <strong>Apexstores</strong>. By accessing our platform, utilizing our services, or purchasing gadgets from our catalog, you explicitly agree to comply with and be bound by the following contractual terms. Please review them carefully before placing an order.
          </p>
        </div>

        {/* Legal Sections */}
        <div className="space-y-8 text-sm text-slate-600 leading-relaxed text-left">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">1. Scope of Service</h2>
            <p className="font-medium text-slate-500">
              Apexstores operates an online electronics retail storefront providing premium gadgets, chargers, and related accessories. We reserve the right to alter, pause, update, or discontinue any product configuration, inventory batch, or website asset at any given moment without prior customer notification.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">2. Pricing & Currency</h2>
            <p className="font-medium text-slate-500">
              All prices listed across our storefront display panels are evaluated in <strong>Kenyan Shillings (Ksh)</strong>. While we work diligently to eliminate formatting bugs, pricing updates or inventory entry adjustments can occasionally happen. In the event an item is ordered under a broken or incorrect price configuration, Apexstores reserves the right to cancel the transaction and issue a correction notice.
            </p>
          </section>

          {/* Section 3 - THE CRITICAL FINAL SALE CLAUSE */}
          <section className="p-5 bg-amber-50 border border-amber-200 rounded-xl">
            <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-2">📢 3. Strict Return & Exchange Policy</h2>
            <p className="text-amber-800 font-bold mb-2">
              Please take extreme care to verify your desired technical specifications and compatibility carefully prior to checking out.
            </p>
            <p className="text-amber-900 font-black bg-white border border-amber-200 p-3 rounded-lg italic">
              "All sales completed on Apexstores are absolute and final. Under no circumstances do we accept returns, process refunds, or offer technical exchanges. Goods once sold cannot be returned."
            </p>
            <p className="text-amber-800 text-xs mt-2 leading-tight font-medium">
              By confirming your purchase checkout sequence and executing payment, you explicitly acknowledge, understand, and agree to this final sale restriction.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">4. Delivery, Shipping & Dispatch</h2>
            <p className="font-medium text-slate-500">
              Once your transaction clears, your details are handed over to local delivery agents or dispatch riders. Delivery timelines provided during checkout are strictly structural estimates. Apexstores is not liable for structural field delays caused by incorrect address coordinates, unreachable phone numbers, or uncoordinated courier pickups.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">5. Intellectual Property</h2>
            <p className="font-medium text-slate-500">
              All text frameworks, interface graphics, UI branding, code modules, item layouts, and unique logo configurations hosted on this platform belong entirely to <strong>Apexstores</strong>. Replicating, stealing, scraping, or reusing these assets for any commercial purpose without express written consent is strictly illegal.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">6. Governing Law</h2>
            <p className="font-medium text-slate-500">
              These Terms & Conditions are constructed under and governed entirely by the laws of the <strong>Republic of Kenya</strong>. Any disputes or issues arising directly from your transactions or engagement with this storefront will fall under the exclusive jurisdiction of the competent local courts.
            </p>
          </section>

        </div>

        {/* Footer Attribution */}
        <div className="border-t mt-10 pt-6 text-center">
          <p className="text-xs font-black text-slate-400 tracking-wider uppercase">
            © {new Date().getFullYear()} Apexstores. All Rights Reserved.
          </p>
        </div>

      </div>
    </div>
  );
}
