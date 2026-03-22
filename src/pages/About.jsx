import { motion } from "framer-motion";
import { Users, Target, ShieldCheck, CheckCircle2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";

function About() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {/* ================= HERO ================= */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          
          {/* LEFT CONTENT */}
          <div className="max-w-lg">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-semibold mb-5"
            >
              About MR Reporting
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-5"
            >
              Transforming <span className="text-blue-600">Pharma Field</span><br />
              Operations with Smart Automation
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-gray-600 text-base md:text-lg leading-relaxed mb-7"
            >
              MR Reporting empowers pharmaceutical companies with intelligent field-force automation, real-time insights, and secure reporting systems designed for modern performance-driven teams.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <button className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm md:text-base font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition duration-300">
                Explore Our Platform
              </button>
            </motion.div>
          </div>

          {/* RIGHT IMAGE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative flex justify-center"
          >
            {/* Decorative Background Shape */}
            <div className="absolute w-[85%] h-[85%] bg-blue-100 rounded-[60px] rotate-6 top-6 right-6"></div>

            {/* Main Image */}
            <div className="relative overflow-hidden rounded-[60px_10px_60px_10px] shadow-2xl border border-blue-100">
              <img
                src="https://images.pexels.com/photos/5726709/pexels-photo-5726709.jpeg?auto=compress&cs=tinysrgb&w=900"
                alt="Medical Representative using tablet"
                className="w-full h-[460px] object-cover"
              />
              {/* Soft Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent"></div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white px-6 py-4 rounded-2xl shadow-xl border border-blue-100">
              <p className="text-sm font-semibold text-gray-700">
                🚀 Trusted by 150+ Pharma Companies
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= MISSION & VISION ================= */}
      <section className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 space-y-28">
          
          {/* MISSION ROW */}
          <div className="grid md:grid-cols-2 gap-20 items-center">
            {/* IMAGE */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src="https://images.pexels.com/photos/3845810/pexels-photo-3845810.jpeg?auto=compress&cs=tinysrgb&w=900"
                alt="Medical Representative Meeting Doctor"
                className="rounded-[40px] shadow-xl w-full h-[420px] object-cover"
              />
            </motion.div>

            {/* CONTENT */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                Our Mission
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Simplifying & Modernizing Field Reporting
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg mb-6">
                Our mission is to transform pharmaceutical operations through intelligent automation and secure digital reporting.
              </p>

              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  Eliminate manual reporting errors
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  Increase MR productivity & accountability
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  Provide real-time performance visibility
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  Ensure secure & transparent workflows
                </li>
              </ul>
            </motion.div>
          </div>

          {/* VISION ROW */}
          <div className="grid md:grid-cols-2 gap-20 items-center">
            {/* CONTENT */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                Our Vision
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Building a Data-Driven Pharma Ecosystem
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg mb-6">
                We envision a future where pharmaceutical companies operate on accurate, real-time data and intelligent automation.
              </p>

              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  Replace guesswork with analytics
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  Enable faster strategic decisions
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  Optimize territory & sales planning
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  Empower leadership with insights
                </li>
              </ul>
            </motion.div>

            {/* IMAGE */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src="https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=900"
                alt="Analytics Dashboard"
                className="rounded-[40px] shadow-xl w-full h-[420px] object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= WHY COMPANIES TRUST MR REPORTING ================= */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* ================= HEADING ================= */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-semibold mb-3">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Why Companies Trust MR Reporting
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Trusted by pharmaceutical teams for secure, scalable and performance-driven field force automation.
            </p>
          </motion.div>

          {/* ================= GRID WITH SAME STAGGER ================= */}
          <motion.div
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.18,
                },
              },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                title: "Secure & Reliable Platform",
                desc: "Enterprise-level security with encrypted data and role-based access control."
              },
              {
                title: "Real-Time Business Insights",
                desc: "Live dashboards and analytics for faster and smarter decision making."
              },
              {
                title: "Scalable Enterprise Architecture",
                desc: "Designed to support multi-region teams and growing organizations."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: -60 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.6,
                      ease: "easeOut"
                    },
                  },
                }}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 font-bold">
                  {index + 1}
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section Added Here */}
      <Testimonials />

      <Footer />
    </div>
  );
}

export default About;