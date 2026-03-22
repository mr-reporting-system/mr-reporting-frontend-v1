import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import api from "../services/api"; // Importing your configured axios instance

function RequestDemoModal({ onClose }) {
  // 🧠 State variables to store the form input
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 🚀 Sending the data to the PostgreSQL backend
      const response = await api.post("/api/contacts/submit", {
        fullName: name,
        companyName: company,
        workEmail: email,
        phoneNumber: phone
      });

      console.log("Form submitted successfully!", response.data);
      alert("Thank you! Your request has been sent.");
      onClose(); // Close the modal after successful submission

    } catch (error) {
      console.error("Submission failed:", error);
      alert("There was an error sending your request. Please try again.");
    }
  };

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* MODAL WRAPPER */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-4xl overflow-hidden relative animate-modalIn grid md:grid-cols-2 mx-auto">
          
          {/* LEFT INFO (DESKTOP ONLY) */}
          <div className="hidden md:flex flex-col justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 p-10 text-gray-800">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">
              Get Started for Free
            </h2>
            <p className="mb-6 text-blue-900/80">
              Discover how MR Reporting helps pharma teams simplify reporting and improve productivity.
            </p>
            <ul className="space-y-3 text-sm text-blue-900">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                Instant system access
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                Track field activity
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                Demo data included
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                No credit card required
              </li>
            </ul>
          </div>
          
          {/* RIGHT FORM (ALL SCREENS) */}
          <div className="p-6 md:p-10 relative bg-white">
            {/* CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 text-2xl hover:text-gray-700 transition"
            >
              X
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-1 text-center md:text-left">
              Contact with us
            </h3>
            <p className="text-gray-500 mb-6 text-center md:text-left">
              Fill Details to get started.
            </p>
            
            {/* 📝 LEAD COLLECTION FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company Name"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work Email"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                className="w-full bg-yellow-400 text-black py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-300 shadow"
              >
                Request For Contact
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default RequestDemoModal;