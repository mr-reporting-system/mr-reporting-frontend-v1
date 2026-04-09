import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

      // Optional cleanup of old keys
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
      setError(err.response?.data?.message || err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[40%_60%] font-sans">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden md:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white px-12 py-14"
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-wider">
            MR <span className="opacity-90">Reporting</span>
          </h1>
        </div>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight mb-6">
            Smarter Reporting.
            <br />
            Better Decisions.
          </h2>
          <p className="text-blue-100 text-lg max-w-md leading-relaxed">
            A secure platform to manage Medical Representative activities, doctor visits, and performance insights efficiently.
          </p>
        </div>
        <div className="text-sm text-blue-200 tracking-wide">© 2026 MR Reporting Software</div>
      </motion.div>

      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex items-center justify-center px-6 sm:px-10"
      >
        <form onSubmit={handleLogin} className="w-full max-w-lg">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Login to your account</h2>
          <p className="text-gray-500 mb-8">Enter your credentials to continue</p>

          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 border border-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email"
              className="w-full border-b-2 border-gray-300 px-1 py-2 bg-transparent focus:outline-none focus:border-blue-600 transition"
              required
            />
          </div>

          <div className="mb-10 relative">
            <label className="block text-sm font-semibold text-gray-600 mb-2">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border-b-2 border-gray-300 px-1 py-2 bg-transparent focus:outline-none focus:border-blue-600 transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-9 text-sm text-blue-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg font-semibold text-lg transition shadow-md text-white ${
              isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

          <div className="mt-14 text-center text-sm text-gray-500">
            <p className="font-semibold mb-2">Need help?</p>
            <p>📞 +91-98XXXXXX90</p>
            <p>✉️ support@mrreporting.com</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default Login;
