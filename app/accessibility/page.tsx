"use strict";
import React from "react";

export default function AccessibilityPage() {
  const lastUpdated = "May 2026";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Header Section */}
        <div className="border-b pb-6 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Accessibility Statement</h1>
          <p className="text-sm text-slate-400 mt-2">Last Updated: {lastUpdated}</p>
          <p className="text-slate-600 mt-4 leading-relaxed">
            At <strong>Apexstores</strong>, we are committed to ensuring digital accessibility for everyone, including people with disabilities. We continuously update our web application interface to improve the user experience for all shoppers and apply the relevant accessibility standards.
          </p>
        </div>

        {/* Policy Body */}
        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">1. Our Commitment</h2>
            <p>
              We believe that premium technology should be accessible to everyone. Our goal is to make our storefront fully compatible with assistive technologies such as screen readers, voice recognition software, and keyboard-only navigation. We measure our platform compliance against the World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
            </p>
          </section>

          {/* Section 2 - Core Accessibility Features */}
          <section className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">🛠️ Built-in Accessibility Features</h2>
            <p className="text-xs leading-relaxed text-slate-600 mb-3">
              Our Next.js frontend architecture incorporates key structural principles to ensure a seamless experience:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
              <li><strong>Semantic Layouts:</strong> We use correct HTML elements (such as landmarks, headers, and buttons) so screen readers can interpret page content accurately.</li>
              <li><strong>Keyboard Navigation:</strong> Interactive components, collection links, and checkout steps are completely navigable using standard keyboard inputs.</li>
              <li><strong>Responsive Adaptation:</strong> The viewport scaling dynamically adapts to diverse screen sizes, magnifying text smoothly without breaking structural layouts.</li>
              <li><strong>Contrast & Colors:</strong> We aim for stark color ratios across text segments and CTA elements to guarantee visibility for users with visual impairments.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">2. Supported Specifications</h2>
            <p>
              The Apexstores storefront relies on modern web protocols to function optimally with your operating system's native accessibility settings and browser extensions:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>HTML5 Semantic Tags</li>
              <li>WAI-ARIA (Accessible Rich Internet Applications) attributes where appropriate</li>
              <li>Tailwind CSS text-scaling fluid layouts</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">3. Ongoing Technical Improvements</h2>
            <p>
              While we strive to maintain comprehensive accessibility across our entire gadget catalog, checkout screens, and profile management blocks, some legacy pages or third-party integrations (like embedded maps or external payment trackers) may occasionally experience friction. We actively monitor and refactor our codebase to identify and fix these limitations.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">4. Feedback & Contact Channels</h2>
            <p className="mb-3">
              We welcome your feedback on the accessibility of Apexstores. If you encounter any accessibility barriers while browsing our collections or completing a purchase, please let us know immediately so we can fix it:
            </p>
            <ul className="list-none space-y-1 font-medium text-slate-800">
              <li>• Support Channel: Digital Feedback Form</li>
              <li>• Response Timeline: We aim to respond to accessibility inquiries within 2 to 3 business days.</li>
            </ul>
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
