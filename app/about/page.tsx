"use strict";
import React from "react";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Header Section */}
        <div className="border-b pb-6 mb-8 text-center sm:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Our Story
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            About Apexstores
          </h1>
          <p className="text-slate-600 mt-4 leading-relaxed text-base">
            We believe that premium technology is more than just a tool—it defines how you connect with the world. Apexstores was founded with a single, clear objective: to bring high-quality, authentic, and high-performance electronics and phone accessories directly to modern tech enthusiasts.
          </p>
        </div>

        {/* Quick Brand Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">100%</div>
            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">Authentic</div>
          </div>
          <div className="border-x border-slate-200">
            <div className="text-xl sm:text-2xl font-black text-slate-900">Ksh</div>
            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">Local Prices</div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">24/7</div>
            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">Fast Dispatch</div>
          </div>
        </div>

        {/* Body Content */}
        <div className="space-y-8 text-sm text-slate-600 leading-relaxed">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">The Quality Standard</h2>
            <p>
              Every gadget and accessory hosted in our inventory undergoes a rigorous curation process. We carefully select products that strike the perfect balance between technical excellence and clean, modern aesthetics. Whether you are looking for crystal-clear audio with our AirPods or reliable power with our fast chargers, we have your tech needs completely covered.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">Our Core Values</h2>
            <p className="mb-3">
              We run our e-commerce operations based on three non-negotiable principles:
            </p>
            <ul className="list-none space-y-3 pl-1">
              <li className="flex items-start">
                <span className="text-indigo-500 mr-2 font-bold">✔</span>
                <span><strong>No Compromise on Authenticity:</strong> What you see on our display cards is precisely what drops at your doorstep. No clones, no unexpected substitutions.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 mr-2 font-bold">✔</span>
                <span><strong>Transparent Operations:</strong> From straightforward pricing in Kenyan Shillings to clear stock counts, we eliminate the guesswork from online shopping.</span>
              </li>
              <li className="flex items-start">
                <span className="text-indigo-500 mr-2 font-bold">✔</span>
                <span><strong>Local Community First:</strong> Optimized specifically for quick local mobile transactions and rapid courier dispatch lines to respect your time.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 - Final Sale Reminder for Context */}
          <section className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">Please Note Before You Shop</h3>
            <p className="text-xs text-slate-500 leading-normal">
              To keep our inventory moving quickly and sustain competitive, honest local pricing structures, Apexstores strictly operates on a final sale model. We encourage our community to check their device compatibility accurately before completing checkout sequences.
            </p>
          </section>

        </div>

        {/* Footer Section */}
<div className="border-t mt-10 pt-6 text-center">
  <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
    © {new Date().getFullYear()} Apexstores. All Rights Reserved.
  </p>
</div>    </div>
    </div>
  );
}
