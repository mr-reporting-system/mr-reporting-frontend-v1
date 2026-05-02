import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/api/users/login", {
        email: username,
        password,
      });

      const token = response?.data?.token;
      const role = response?.data?.role;

      if (!token || !role) {
        throw new Error("Login response missing token or role.");
      }

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("role", role);

      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("userRole");
      sessionStorage.removeItem("mr_token");
      sessionStorage.removeItem("mr_user");

      if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (role === "MANAGER") {
        navigate("/manager");
      } else if (role === "MR") {
        navigate("/mr");
      } else {
        navigate("/");
      }
    } catch (err) {
  console.log("Status:", err?.response?.status);
  console.log("Backend says:", err?.response?.data);
  setError(err.response?.data?.message || err.message || "Invalid credentials.");
}finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
      {/* LEFT PANEL - DARK BRANDING */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden md:flex flex-col justify-between bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 px-12 py-16 relative overflow-hidden"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <motion.div
            animate={{ 
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-60 -right-60 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"
          ></motion.div>
          <motion.div
            animate={{ 
              x: [0, -50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-60 -left-60 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          ></motion.div>
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <span className="text-xl font-light text-white tracking-widest" style={{ fontFamily: "Georgia, serif" }}>
            MR Reporting
          </span>
        </motion.div>

        {/* Center Content */}
        <div className="relative z-10 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-5xl lg:text-6xl font-light text-white leading-tight mb-6" style={{ fontFamily: "Georgia, serif" }}>
              Revolutionize
              <br />
              MR Operations
            </h2>
            <p className="text-lg text-blue-200/80 leading-relaxed max-w-lg font-light">
              Streamline field operations, track doctor visits, and generate comprehensive analytics with enterprise-grade reliability.
            </p>
          </motion.div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="border-l-2 border-blue-400/50 pl-6 my-12"
          >
            <p className="text-blue-100/90 italic text-base leading-relaxed font-light">
              "MR Reporting has transformed how we manage field operations. The insights are invaluable for our team's success."
            </p>
          </motion.div>
          
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 grid grid-cols-3 gap-8 pt-2 border-t border-blue-400/20"
        >
          <div>
            <p className="text-3xl font-light text-white">2.5K+</p>
            <p className="text-xs text-blue-300/70 mt-2 font-light uppercase tracking-wide">Active Users</p>
          </div>
          <div>
            <p className="text-3xl font-light text-white">99.8%</p>
            <p className="text-xs text-blue-300/70 mt-2 font-light uppercase tracking-wide">Uptime</p>
          </div>
          <div>
            <p className="text-3xl font-light text-white">24/7</p>
            <p className="text-xs text-blue-300/70 mt-2 font-light uppercase tracking-wide">Support</p>
          </div>
        </motion.div>
      </motion.div>

      {/* RIGHT PANEL - ELEGANT FORM */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col justify-between px-8 sm:px-12 lg:px-16 py-12 md:py-16 bg-white"
      >
        

        {/* Form Section */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          {/* Heading - Serif Font for Elegance */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-3"
          >
            <h1 className="text-5xl font-light text-gray-900 mb-2" style={{ fontFamily: "Georgia, serif" }}>
              Welcome back!
            </h1>
            <p className="text-sm text-gray-500 font-light">
              Sign in to your account and continue optimizing.
            </p>
          </motion.div>

          <div className="mb-8"></div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2"
            >
              <span>⚠</span>
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form */}
<form onSubmit={handleLogin} className="space-y-6">

  {/* Email Input */}
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
  >
    <label className="block text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">
      Email
    </label>
    <input
      type="email"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      placeholder="Enter your email"
      autoComplete="username"
      className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 bg-white"
      required
    />
  </motion.div>

  {/* Password Input */}
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
  >
    <label className="block text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">
      Password
    </label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••••"
        autoComplete="current-password"
        className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 bg-white"
        required
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {showPassword ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  </motion.div>

  {/* Remember Me */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.6 }}
    className="flex items-center justify-between py-2"
  >
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={rememberMe}
        onChange={(e) => setRememberMe(e.target.checked)}
        className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
      />
      <span className="font-medium">Remember me</span>
    </label>
    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
      Forgot Password
    </a>
  </motion.div>

  {/* Button */}
  <motion.button
    type="submit"
    disabled={isLoading}
    className={`w-full py-3 rounded-md font-semibold text-white mt-4 ${
      isLoading ? "bg-blue-500/70 cursor-not-allowed" : "bg-gray-900 hover:bg-blue-700"
    }`}
  >
    {isLoading ? "Signing In..." : "Sign In"}
  </motion.button>

</form>
        </div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-12 pt-8 border-t border-gray-200"
        >
          <p className="text-xs font-semibold text-gray-900 mb-6 uppercase tracking-wide">
            Need Help?
          </p>
          <div className="space-y-4">
            {/* Phone */}
            <a href="tel:+919800000090" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948.684l1.498 4.493a1 1 0 00.502.756l2.73 1.365a1 1 0 001.27-1.27l-1.365-2.73a1 1 0 00-.756-.502L9.177 3.276a1 1 0 00-.684-.948H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</p>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">+91-98XXXXXX90</p>
              </div>
            </a>

            {/* Email */}
            <a href="mailto:support@mrreporting.com" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">support@mrreporting.com</p>
              </div>
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;