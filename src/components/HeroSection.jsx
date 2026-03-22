import React from "react";
import { motion } from "framer-motion";

export default function HeroSection({ setOpenDemo }) {
  /* ===== Parent Stagger ===== */
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.18,
      },
    },
  };

  /* ===== Smooth Fade + Blur + Slide ===== */
  const fadeUp = {
    hidden: { opacity: 0, y: 50, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.7,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 min-h-[85dvh] sm:min-h-0 flex items-start sm:block pt-36 py-0 sm:py-10 md:py-10 lg:py-10">
        <div className="grid sm:grid-cols-2 gap-10 lg:gap-16 items-center w-full">
          
          {/* ================= LEFT CONTENT ================= */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-xl text-left"
          >
            <motion.p
              variants={fadeUp}
              className="text-xs sm:text-sm font-semibold text-blue-500 tracking-wider"
            >
              SMART PHARMA SOLUTION
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-5 text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-extrabold text-gray-900 leading-tight"
            >
              Advanced <br />
              MR Reporting <br />
              <span className="text-blue-500 italic">Software</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed"
            >
              Automate Daily Call Reports, track doctor visits,
              monitor sales performance and generate analytics
              in real-time with our secure MR Reporting system.
            </motion.p>
            <motion.div variants={fadeUp}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpenDemo(true)}
                className="mt-7 bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:bg-blue-600 transition duration-300"
              >
                Book Free Demo
              </motion.button>
            </motion.div>
          </motion.div>

          {/* ================= RIGHT CONTENT ================= */}
          <div className="hidden sm:grid grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Floating Image Animation */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              whileHover={{ scale: 1.03 }}
              className="overflow-hidden shadow-lg rounded-[60%_40%_50%_30%/40%_50%_30%_60%]"
            >
              <img
                src="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80"
                alt="MR Dashboard"
                className="w-full h-48 md:h-52 lg:h-60 object-cover"
              />
            </motion.div>

            {/* DCR Submitted Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              whileHover={{ scale: 1.03 }}
              className="bg-blue-50 flex flex-col items-center justify-center text-center p-6 shadow-sm h-48 md:h-52 lg:h-60 rounded-[60%_40%_50%_30%/40%_50%_30%_60%]"
            >
              <div className="bg-blue-100 p-3 rounded-full text-blue-600 font-bold">
                ✓
              </div>
              <h3 className="mt-4 font-semibold text-gray-800">
                DCR Submitted
              </h3>
              <p className="text-sm text-gray-600 mt-2 max-w-[160px]">
                Field report approved successfully
              </p>
            </motion.div>

            {/* Monthly Reports Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              whileHover={{ scale: 1.03 }}
              className="bg-blue-400 text-white flex flex-col items-center justify-center text-center shadow-lg h-48 md:h-52 lg:h-60 rounded-[60%_40%_50%_30%/40%_50%_30%_60%]"
            >
              <h2 className="text-lg lg:text-xl font-bold">1,248</h2>
              <p className="text-xs mt-2 opacity-90">Monthly DCR Reports</p>
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="Manager"
                className="mt-3 w-10 h-10 rounded-full object-cover border-4 border-white"
              />
            </motion.div>

            {/* Doctor Visit Image */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              whileHover={{ scale: 1.03 }}
              className="overflow-hidden shadow-lg rounded-[60%_40%_50%_30%/40%_50%_30%_60%]"
            >
              <img
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=800&q=80"
                alt="Doctor Visit"
                className="w-full h-48 md:h-52 lg:h-60 object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
