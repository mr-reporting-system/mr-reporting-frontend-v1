import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    company: "Goddres Pharma",
    role: "Director",
    text: "Our sales have increased & we are delighted.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    company: "Lift Life Biotech",
    role: "Director",
    text: "The company now performs like an orchestra - leading to healthy profits.",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    company: "Windlas Biotech",
    role: "Director",
    text: "It has helped our company realize MORE per MR.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    company: "Sun Pharma",
    role: "Manager",
    text: "Decision making is now faster and data driven.",
    image: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    company: "Cipla Ltd",
    role: "Director",
    text: "Very smooth DCR and reporting workflow.",
    image: "https://randomuser.me/api/portraits/men/76.jpg",
  },
  {
    company: "Aurobindo Pharma",
    role: "Sales Head",
    text: "Excellent visibility of MR activity across regions.",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
  }
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) =>
        prev + 3 >= testimonials.length ? 0 : prev + 3
      );
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const visible = testimonials.slice(index, index + 3);

  return (
    <section className="bg-white py-32 flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADING */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm mb-4 font-semibold">
            Testimonials
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900">
            What Our Clients Say
          </h2>
        </motion.div>

        {/* SLIDER */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-3 gap-8"
          >
            {visible.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 80, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  delay: i * 0.2,
                  duration: 0.6,
                  ease: "easeOut",
                }}
              >
                <TestimonialCard {...item} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ================= CARD ================= */
function TestimonialCard({ company, role, text, image }) {
  return (
    <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
      
      {/* BLUE QUOTE CORNER */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-600 rounded-bl-full flex items-center justify-center text-white text-3xl font-bold">
        "
      </div>
      
      {/* PROFILE */}
      <div className="flex items-center gap-4 mb-4">
        <img
          src={image}
          alt={company}
          className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-100"
        />
        <div>
          <h4 className="font-bold text-gray-900">{company}</h4>
          <p className="text-sm text-blue-600">{role}</p>
        </div>
      </div>
      
      {/* TEXT */}
      <p className="text-gray-600 leading-relaxed">
        "{text}"
      </p>
    </div>
  );
}