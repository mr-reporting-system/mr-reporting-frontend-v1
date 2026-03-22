import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";
import { motion } from "framer-motion";
import api from "../services/api"; // Make sure to import your api instance!

export default function Contact() {
  // 1. State variables matching your backend requirements
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Array of objects to easily map our inputs and their state
  const inputFields = [
    { placeholder: "Full Name", value: fullName, setter: setFullName, type: "text" },
    { placeholder: "Company Name", value: companyName, setter: setCompanyName, type: "text" },
    { placeholder: "Work Email Address", value: workEmail, setter: setWorkEmail, type: "email" },
    { placeholder: "Phone Number", value: phoneNumber, setter: setPhoneNumber, type: "tel" },
  ];

  // 2. Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/api/contacts/submit", {
        fullName: fullName,
        companyName: companyName,
        workEmail: workEmail,
        phoneNumber: phoneNumber
      });
      
      console.log("Contact form submitted:", response.data);
      alert("Thank you! Your request has been sent.");
      
      // Clear the form after successful submission
      setFullName("");
      setCompanyName("");
      setWorkEmail("");
      setPhoneNumber("");

    } catch (error) {
      console.error("Submission failed:", error);
      alert("There was an error sending your request. Please try again.");
    }
  };

  return (
    <>
      <Header />

      {/* ================= FORM + IMAGE SECTION ================= */}
      <section className="bg-white-50 py-14">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">

          {/* LEFT IMAGE */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex justify-center"
          >
            <img
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80"
              alt="Team working"
              className="rounded-3xl shadow-xl w-full max-w-lg h-[420px] object-cover"
            />
          </motion.div>

          {/* RIGHT CONTENT */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >

            {/* Heading */}
            <motion.h2
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6"
            >
              Trusted for 20+ Years
            </motion.h2>

            {/* Paragraph */}
            <motion.p
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-gray-600 leading-relaxed mb-8"
            >
              Since 2005, our SaaS SFA platform has supported 
              <span className="font-semibold text-blue-600"> 150+ life science companies </span> 
              and empowered 
              <span className="font-semibold text-blue-600"> 10,000+ medical representatives </span> 
              with smart reporting, tour planning, and analytics.
            </motion.p>

            {/* Subheading */}
            <motion.h3
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-2xl font-semibold text-gray-900 mb-4"
            >
              Get a Free Personalized Demo
            </motion.h3>

            {/* FORM */}
            <form className="space-y-5" onSubmit={handleSubmit}>

              {inputFields.map((field, index) => (
                <motion.input
                  key={index}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  required
                  initial={{ opacity: 0, x: 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: 0.8 + index * 0.2,
                    duration: 0.5
                  }}
                  className="w-full px-5 py-3 rounded-xl border border-gray-200 
                             focus:outline-none focus:ring-2 focus:ring-blue-100 
                             focus:border-blue-500 transition"
                />
              ))}

              <motion.button
                type="submit"
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.6, duration: 0.5 }}
                className="w-full bg-blue-600 text-white py-3 rounded-xl
                           font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                Request Demo
              </motion.button>

            </form>

          </motion.div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <Testimonials />

      <Footer />
    </>
  );
}