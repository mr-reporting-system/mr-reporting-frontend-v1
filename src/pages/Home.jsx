import { useState } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import useScrollReveal from "../hooks/useScrollReveal";

import HeroSection from "../components/HeroSection";
import Testimonials from "../components/Testimonials";
import RequestDemoModal from "../components/RequestDemoModal";

function Home() {
  const [openDemo, setOpenDemo] = useState(false);
  const [stepsRef, stepsVisible] = useScrollReveal();

  return (
    <div className="w-full flex flex-col overflow-hidden">
      {/* ================= HEADER ================= */}
      <Header />

      {/* ================= HERO SECTION ================= */}
      <HeroSection setOpenDemo={setOpenDemo} />

      {/* ================= GET STARTED STEPS ================= */}
      <section
        ref={stepsRef}
        className={`bg-white py-24 reveal ${stepsVisible ? "reveal-left" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Get Started in Just 3 Simple Steps
          </h2>
          <p className="text-gray-600 mb-16">
            Launch your MR Reporting system quickly and efficiently
          </p>

          <div className="grid md:grid-cols-3 gap-16">
            {/* STEP 1 */}
            <div className="flex flex-col items-center group">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <svg className="w-12 h-12 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className="mt-6 text-blue-600 font-semibold">Step 1</p>
              <h4 className="mt-2 text-lg font-bold text-gray-900">Request a Demo</h4>
              <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
                Connect with our team and understand how MR Reporting fits your workflow.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="flex flex-col items-center group">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <svg className="w-12 h-12 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <p className="mt-6 text-blue-600 font-semibold">Step 2</p>
              <h4 className="mt-2 text-lg font-bold text-gray-900">Secure Web Login Setup</h4>
              <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
                We configure your organization, roles, and access securely on the web platform.
              </p>
            </div>

            {/* STEP 3 */}
            <div className="flex flex-col items-center group">
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center shadow-md group-hover:scale-110 transition">
                <svg className="w-12 h-12 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <p className="mt-6 text-blue-600 font-semibold">Step 3</p>
              <h4 className="mt-2 text-lg font-bold text-gray-900">Start Tracking & Reporting</h4>
              <p className="text-sm text-gray-500 mt-2 text-center max-w-xs">
                Monitor DCR, field activities, approvals, and analytics in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CALL TO ACTION ================= */}
      <section className="py-16 px-4 sm:px-6 md:px-8 lg:px-0">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-6 sm:px-8 py-16 sm:py-12 min-h-[320px] sm:min-h-0 rounded-2xl bg-gradient-to-b from-sky-200 to-white flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-3xl"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Try our <span className="text-blue-600">service today!</span>
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Modern aims at helping the pharmaceutical companies increase their productivity. Click the button & start your journey with us!
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <motion.button
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpenDemo(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Try Now!
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* ================= CORE FEATURES ================= */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-semibold mb-3">
              Core Features
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Everything Your Field Team Needs
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A complete web-based MR Reporting solution designed to streamline operations, improve visibility, and enhance performance.
            </p>
          </motion.div>

          <motion.div
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.2 } }
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { title: "Daily Call Reporting (DCR)", desc: "Intuitive web interfaces for MRs to log doctor visits, sample distributions and call outcomes." },
              { title: "E-Detailing", desc: "Interactive digital detailing tools with slides, videos and engagement tracking." },
              { title: "Automated Attendance Tracking", desc: "Captures field presence directly from DCR submissions-no separate punch-in required." },
              { title: "Automated Expense Management", desc: "Collects and categorizes TA/DA and other expenses for seamless claims processing." },
              { title: "Offline Mode & Sync", desc: "Works without internet; automatically syncs data when connectivity is restored." },
              { title: "Real-Time Analytics Dashboards", desc: "Customizable dashboards to track KPIs, coverage, frequency and sales trends." },
              { title: "Geo-Tagging & Geo-Fencing", desc: "Verifies visit locations with GPS tags and enforces authorized visit zones." },
              { title: "Secondary Sales Calculation", desc: "Generates per-product, stockist and territory-level secondary sales reports." },
              { title: "Sales & Target Management", desc: "Assign targets, monitor achievements and compare team vs individual performance." }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: -60 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                }}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 font-bold">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
                <Testimonials />
      {/* ================= FAQ SECTION ================= */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center text-slate-900 mb-12"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-4">
            {[
              { q: "What is MR Reporting?", a: "MR Reporting is a system used to track daily activities of Medical Representatives such as doctor visits, promoted medicines, orders, and performance reports." },
              { q: "How does it help sales businesses?", a: "It provides real-time visibility of field activities, improves productivity, reduces manual errors, and helps management make data-driven decisions." },
              { q: "Can I try it before committing?", a: "Yes, the system can be explored through demo access to understand features before full deployment." },
              { q: "Is tracking my MRs ethical?", a: "Yes, tracking is done transparently for professional performance monitoring and follows organizational policies." },
              { q: "What features does the MR Reporting system offer?", a: "It offers DCR management, doctor visit tracking, medicine promotion, order analysis, and role-based dashboards." },
              { q: "How do I get started?", a: "Simply login to the system and access the role-based dashboard to begin managing reports." }
            ].map((item, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
                className="group border border-slate-200 rounded-xl px-5 py-4 hover:border-blue-400 transition-all duration-200"
              >
                <summary className="flex justify-between items-center text-slate-800 font-semibold cursor-pointer list-none">
                  {item.q}
                  <span className="text-blue-600 text-lg transition-transform duration-200 group-open:rotate-180">+</span>
                </summary>
                <p className="mt-3 text-slate-600 text-sm leading-relaxed">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <Footer />

      {openDemo && <RequestDemoModal onClose={() => setOpenDemo(false)} />} 
    </div>
  );
}

export default Home;