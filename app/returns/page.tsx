"use strict";
import React from "react";

export default function ReturnsAndExchangesPage() {
  const lastUpdated = "May 2026";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Header Section */}
        <div className="border-b pb-6 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Returns & Exchanges Policy</h1>
          <p className="text-sm text-slate-400 mt-2">Last Updated: {lastUpdated}</p>
          <p className="text-slate-600 mt-4 leading-relaxed">
            Thank you for shopping at <strong>Apexstores</strong>. To maintain our commitment to offering highly competitive local pricing, rapid dispatch turnarounds, and authentic gadgets, we operate under a strict structural retail policy regarding order modifications.
          </p>
        </div>

        {/* Core Policy Highlight */}
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl mb-8">
          <h2 className="text-sm font-bold text-rose-900 uppercase tracking-wider mb-2">⚠️ Final Sale Agreement</h2>
          <p className="text-rose-900 font-bold bg-white border border-rose-100 p-4 rounded-lg italic text-base">
            "All transactions processed on Apexstores are absolute and final. We do not offer cash refunds, store credit refunds, or technical exchanges under any circumstances once an order has been completed and dispatched. Goods once sold cannot be returned."
          </p>
          <p className="text-rose-800 text-xs mt-3 leading-relaxed">
            By confirming your M-Pesa or alternative payment checkout sequence, you formally acknowledge and agree that you have checked your device compatibility, specifications, and order details thoroughly.
          </p>
        </div>

        {/* Policy Body Layout */}
        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">1. Why We Enforce a No-Return Policy</h2>
            <p>
              Electronics logistics demand immense care to ensure absolute technical integrity and product authenticity. By enforcing a strict final-sale policy, we guarantee that every single charger or pair of AirPods arriving at a customer's doorstep is 100% brand new, sealed, and untouched by previous buyers. Additionally, this allows us to avoid the heavy operational overhead of reverse shipping, passing those direct savings on to you in the form of lower retail prices in Kenyan Shillings (Ksh).
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">2. How to Ensure the Perfect Choice Before Ordering</h2>
            <p className="mb-3">
              Because technical specifications can vary across different smartphone models and brands, we highly recommend taking the following preventative steps before finalizing your cart checkout:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Verify your device model and required port types (USB-C, Lightning, etc.).</li>
              <li>Check the power output requirements for your specific phone or tablet.</li>
              <li>Review the specific product description panels hosted on our storefront for any unique compatibility notes.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">3. Exceptions for Order Errors</h2>
            <p>
              We stand firmly behind our fulfillment workflows. The absolute only exception to this policy is if an error was explicitly made by the Apexstores distribution center.
            </p>
            <p className="mt-2">
              If we inadvertently dispatch the completely wrong gadget model variant compared to what is explicitly listed on your digital invoice receipt, please flag it with our team within <strong>24 hours</strong> of courier delivery. The product must remain completely sealed, unused, and in its original packaging to qualify for a corrective replacement.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">4. Order Cancellation Limitations</h2>
            <p>
              Our automated backend framework hands over dispatch data to delivery drivers and courier agents almost immediately after payment verification. Because of this high-speed logistics setup, orders cannot be cancelled, adjusted, or reassigned once payment confirmation is finalized.
            </p>
          </section>

        </div>

        {/* Footer Section */}

<div className="border-t mt-10 pt-6 text-center">
  <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
    © {new Date().getFullYear()} Apexstores. All Rights Reserved.
  </p>
</div>
      </div>
    </div>
  );
}
