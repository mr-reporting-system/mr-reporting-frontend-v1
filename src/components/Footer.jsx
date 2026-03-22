import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaChevronRight,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#f4f6fb] py-6 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-[#071a2f] to-[#0a2342] text-white rounded-3xl shadow-xl px-6 sm:px-10 lg:px-16 py-14"
        >
          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {/* BRAND */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h2 className="text-2xl font-extrabold tracking-wide mb-4">
                MR REPORTING
              </h2>
              <p className="text-sm text-white/80 leading-relaxed mb-6">
                At MR Reporting, we believe that every pharma field team deserves
                a seamless way to capture, analyze, and act on their day-to-day
                interactions with confidence.
              </p>
              {/* SOCIAL ICONS */}
              <div className="flex gap-4">
                {[FaFacebookF, FaLinkedinIn, FaInstagram].map((Icon, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.2 }}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white hover:text-blue-600 transition duration-300 cursor-pointer"
                  >
                    <Icon />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* QUICK LINKS */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <h4 className="font-semibold mb-4 text-lg">Quick Links</h4>
              <ul className="space-y-3 text-sm text-white/80">
                <motion.li whileHover={{ x: 6 }}>
                  <Link to="/" className="flex items-center gap-2 hover:text-white transition">
                    <FaChevronRight className="text-blue-400 text-xs" />
                    Home
                  </Link>
                </motion.li>
                <motion.li whileHover={{ x: 6 }}>
                  <Link to="/about" className="flex items-center gap-2 hover:text-white transition">
                    <FaChevronRight className="text-blue-400 text-xs" />
                    About Us
                  </Link>
                </motion.li>
                <motion.li whileHover={{ x: 6 }}>
                  <Link to="/services" className="flex items-center gap-2 hover:text-white transition">
                    <FaChevronRight className="text-blue-400 text-xs" />
                    Services
                  </Link>
                </motion.li>
                <motion.li whileHover={{ x: 6 }}>
                  <Link to="/contact" className="flex items-center gap-2 hover:text-white transition">
                    <FaChevronRight className="text-blue-400 text-xs" />
                    Contact Us
                  </Link>
                </motion.li>
              </ul>
            </motion.div>

            {/* CONTACT */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <h4 className="font-semibold mb-4 text-lg">Get in Touch</h4>
              <ul className="space-y-4 text-sm text-white/80">
                <li className="flex items-center gap-3 hover:text-white transition">
                  <FaPhoneAlt className="text-blue-400" />
                  +91-8769667289
                </li>
                <li className="flex items-center gap-3 hover:text-white transition">
                  <FaEnvelope className="text-blue-400" />
                  info@mrreporting.com
                </li>
                <li className="flex items-start gap-3 hover:text-white transition">
                  <FaMapMarkerAlt className="text-blue-400 mt-1" />
                  <span>
                    Presidency University<br />
                    Itgalpura, Rajanukunte, Yelahanka <br />
                    Bengaluru, Karnataka - 560064
                  </span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* DIVIDER */}
          <div className="border-t border-white/20 my-8"></div>

          {/* BOTTOM BAR */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/70 text-center md:text-left"
          >
            <span>
              2026 MR Reporting Software | MCA Final Year Project
            </span>
            <div className="flex gap-6">
              <span className="hover:text-white cursor-pointer transition">
                Privacy Policy
              </span>
              <span className="hover:text-white cursor-pointer transition">
                Terms & Conditions
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}