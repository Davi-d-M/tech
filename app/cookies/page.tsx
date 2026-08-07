"use strict";
import React from "react";

export default function CookiePolicyPage() {
  const lastUpdated = "May 2026";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Header Section */}
        <div className="border-b pb-6 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Cookie Policy</h1>
          <p className="text-sm text-slate-400 mt-2">Last Updated: {lastUpdated}</p>
          <p className="text-slate-600 mt-4 leading-relaxed font-medium">
            At <strong>Apexstores</strong>, we believe in being completely clear and transparent about how we collect and process data. This Cookie Policy explains what cookies are, how we use them on our tech storefront, and how you can manage your preferences.
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">1. What Are Cookies?</h2>
            <p className="font-medium text-slate-500">
              Cookies are small, harmless text files placed on your computer or mobile device by websites that you visit. They are widely used to make web platforms function correctly, allow users to navigate smoothly between tech categories, and remember system choices (like item arrays or local configurations).
            </p>
          </section>

          {/* Section 2 - THE ESSENTIAL FUNCTIONALITY WARNING */}
          <section className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
            <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">🛒 Why Cookies Matter for Your Tech Bag</h2>
            <p className="text-xs leading-relaxed text-indigo-800 font-medium">
              Without cookies active, an online e-commerce shop cannot function. Our application uses <strong>Essential Session Cookies</strong> to keep track of your selected gadgets as you browse our collections. If you disable cookies in your browser settings, your bag items will automatically disappear whenever you refresh or switch pages, preventing you from checking out successfully.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">2. Types of Cookies We Use</h2>
            <p className="mb-3 font-medium text-slate-500">We use a minimal footprint of tracking objects to run our gadget showcase safely:</p>
            <ul className="list-disc pl-5 space-y-3 font-medium text-slate-500">
              <li>
                <strong>Necessary Cookies:</strong> These are strictly mandatory to enable basic features such as site security, checkout form state preservation, and cart management.
              </li>
              <li>
                <strong>Preference Cookies:</strong> These allow our store interface to remember choices you make during your active sessions (such as preferred sorting filters or local country view variants).
              </li>
              <li>
                <strong>Performance Analytics:</strong> These help us look at anonymous user movement traffic patterns. They tell us which chargers or AirPods are gaining the most popularity so we can restructure inventory efficiently.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">3. How to Manage Cookies</h2>
            <p className="mb-3 font-medium text-slate-500">
              Most web browsers allow you to control cookie handling through their global settings dashboards. You can configure your browser to block cookies entirely or alert you when a cookie is being sent. 
            </p>
            <p className="font-medium text-slate-500">
              To modify these parameters, open your browser tools menu (usually found under **Settings &gt; Privacy &gt; Cookies**). However, please remember that clearing or rejecting our necessary cookies means you will be unable to finalize your gadget orders via our checkout page.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">4. Updates to This Policy</h2>
            <p className="font-medium text-slate-500">
              We may periodically update this Cookie Policy to match unexpected layout modifications or changing local regulatory requirements. We recommend reviewing this section occasionally to stay informed about how we maintain clean, secure user experiences.
            </p>
          </section>

        </div>

        {/* Footer Section */}
        <div className="border-t mt-10 pt-6 text-center">
          <p className="text-xs font-black text-slate-400 tracking-wider uppercase">
            © {new Date().getFullYear()} Apexstores. All Rights Reserved.
          </p>
        </div>

      </div>
    </div>
  );
}
