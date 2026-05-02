import React from "react";
import { motion } from "framer-motion";

export default function HeroSection({ setOpenDemo }) {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        
        {/* ================= LEFT CONTENT ================= */}
        <div className="max-w-lg">
          
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-semibold mb-5"
          >
            SMART PHARMA SOLUTION
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-5"
          >
            Advanced <br />
            MR Reporting <br />
            <span className="text-blue-600 italic">Software</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-gray-600 text-base md:text-lg leading-relaxed mb-7"
          >
            Automate Daily Call Reports, track doctor visits,
            monitor sales performance and generate analytics
            in real-time with our secure MR Reporting system.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <button
              onClick={() => setOpenDemo(true)}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm md:text-base font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition duration-300"
            >
              Book Free Demo
            </button>
          </motion.div>
        </div>

        {/* ================= RIGHT IMAGE ================= */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative flex justify-center"
        >
          {/* Background Shape */}
          <div className="absolute w-[85%] h-[85%] bg-blue-100 rounded-[60px] rotate-6 top-6 right-6"></div>

          {/* Main Image (NEW FILE IMAGE USED) */}
          <div className="relative overflow-hidden rounded-[60px_10px_60px_10px] shadow-2xl border border-blue-100">
            <img
              src="https://images.pexels.com/photos/5726709/pexels-photo-5726709.jpeg?auto=compress&cs=tinysrgb&w=900"
              alt="Medical Representative using tablet"
              className="w-full h-[460px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent"></div>
          </div>

          {/* Floating Badge UPDATED */}
          <div className="absolute -bottom-6 -left-6 bg-white px-6 py-4 rounded-2xl shadow-xl border border-blue-100">
            <p className="text-sm font-semibold text-gray-700">
              🚀 Trusted by 150+ Pharma Companies
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}