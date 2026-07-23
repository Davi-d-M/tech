"use strict";
import React from "react";

export default function PrivacyPolicyPage() {
  const lastUpdated = "May 2026";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Header Section */}
        <div className="border-b pb-6 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Privacy Policy</h1>
          <p className="text-sm text-slate-400 mt-2">Last Updated: {lastUpdated}</p>
          <p className="text-slate-600 mt-4 leading-relaxed font-medium">
            At <strong>Apexstores</strong>, we appreciate the trust you place in us when shopping for premium electronics.
            This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from our gadget store.
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-sm text-slate-600 leading-relaxed font-medium text-left">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">1. Information We Collect</h2>
            <p className="mb-3 text-slate-500">
              When you visit or purchase from Apexstores, we collect specific details necessary to complete your order and improve your tech browsing experience:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-500">
              <li><strong>Device Information:</strong> Your web browser parameters, local IP address, time zone configurations, and relevant tracking cookie details.</li>
              <li><strong>Order Information:</strong> Your full name, explicit physical delivery address, shipping location details, and a valid telephone number.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">2. How We Use Your Information</h2>
            <p className="mb-3 text-slate-500">We utilize your gathered data strictly to fulfill your customer demands:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-500">
              <li>Arranging delivery, managing local carrier dispatch, and generating order confirmation receipts.</li>
              <li>Communicating order tracking milestones directly to your phone.</li>
              <li>Screening incoming transactions for potential security risks or automated fraud patterns.</li>
            </ul>
          </section>

          {/* Section 3 - Vital Payment Note */}
          <section className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
            <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">🔒 Payment & M-Pesa Security</h2>
            <p className="text-xs leading-relaxed text-indigo-800 font-medium">
              Your security is our absolute priority. Apexstores integration frameworks <strong>never</strong> store your private PIN codes or direct financial credentials.
              All financial executions are handled via direct checkout prompts safely through official mobile carrier infrastructure links (such as Safaricom Daraja STK channels).
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">3. Data Sharing & Third Parties</h2>
            <p className="text-slate-500">
              We only share your information with localized third parties that are strictly necessary to fulfill your shopping journey (such as providing your delivery details to a dispatch rider or courier service). We do not rent, lease, or sell customer databases to any exterior advertisement agencies.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">4. Cookies</h2>
            <p className="text-slate-500">
              Our storefront utilizes temporary data cookies to remember items you have added to your tech bag while moving across pages. Disabling cookies inside your browser preferences may cause your persistent cart items to reset during navigation.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3 uppercase tracking-tight">5. Contact Us</h2>
            <p className="text-slate-500">
              For more information regarding our privacy protocols, or if you have any questions regarding your order records, please visit our dedicated contact channel or reach out directly via our support team.
            </p>
          </section>

        </div>

        {/* Brand Signoff */}
        <div className="border-t mt-10 pt-6 text-center">
          <p className="text-xs font-black text-slate-400 tracking-wider uppercase">
            © {new Date().getFullYear()} Apexstores. All Rights Reserved.
          </p>
        </div>

      </div>
    </div>
  );
}
