import React from "react";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

function ServicesSection() {
  const services = [
    {
      title: "Implementation & Deployment",
      features: [
        "Complete system setup & configuration",
        "Role-based access implementation",
        "Cloud or On-premise deployment",
        "Data migration from existing systems",
      ],
    },
    {
      title: "Customization & Integration",
      features: [
        "Custom workflow configuration",
        "Custom report formats",
        "ERP / CRM integration",
        "API & third-party system connectivity",
      ],
    },
    {
      title: "Training & Onboarding",
      features: [
        "Admin & Manager training sessions",
        "Field MR onboarding programs",
        "Step-by-step documentation",
        "Live support assistance",
      ],
    },
    {
      title: "Support & Maintenance",
      features: [
        "24/7 technical support",
        "Regular updates & improvements",
        "Security monitoring & patches",
        "Performance optimization",
      ],
    },
    {
      title: "Analytics & Consulting",
      features: [
        "Sales performance consulting",
        "Territory planning guidance",
        "KPI & productivity analysis",
        "Growth strategy recommendations",
      ],
    },
    {
      title: "Scalable Enterprise Solutions",
      features: [
        "Multi-region team management",
        "Enterprise-level data security",
        "Custom dashboards for executives",
        "Scalable cloud infrastructure",
      ],
    },
  ];

  return (
    <section className="bg-[#F3F4F6] py-16 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ================= HEADING ================= */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block bg-white text-blue-600 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-sm mb-4">
            Our Services
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            End-to-End Pharma Solutions
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            Beyond software, we provide complete support, customization,
            deployment and consulting services to help pharmaceutical
            businesses scale efficiently.
          </p>
        </motion.div>

        {/* ================= GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: index * 0.15,
                duration: 0.6,
                ease: "easeOut",
              }}
              whileHover={{ y: -6 }}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Title */}
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                {service.title}
              </h3>
              <div className="mt-4 mb-6 h-px bg-gray-200"></div>
              
              {/* Features */}
              <ul className="space-y-3">
                {service.features.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: i * 0.08,
                      duration: 0.4,
                    }}
                    className="flex items-start gap-3 text-sm text-gray-600"
                  >
                    <CheckCircle
                      size={18}
                      className="text-blue-600 mt-1 shrink-0"
                    />
                    <span className="leading-relaxed">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;