import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import axios from "axios";
import {
  Bot,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

const Login = () => {
  // --- State Management ---
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // --- Handlers ---
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.type === "email" ? "email" : "password"]: e.target.value,
    });
    // Clear error when user starts typing again
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // REPLACE with your actual API endpoint
      const response = await axios.post(
        "https://promptly-9p83.onrender.com/api/auth/login",
        {
          email: formData.email,
          password: formData.password,
        },
        {
          withCredentials: true,
        }
      );

      login(response.data.user);

      toast.success("Login Successful!");
      navigate("/");
    } catch (err) {
      // Handle Error
      console.error("Login Error:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Invalid email or password. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* --- Left Side: Branding & Visuals --- */}
      <div className="left-panel">
        <div className="left-content">
          <div className="brand">
            <div className="brand-icon">
              <Bot size={28} />
            </div>
            <span>Promptly</span>
          </div>

          <div className="hero-text-container">
            <h1 className="hero-title">
              Intelligence, <br />
              <span className="highlight-text">simplified.</span>
            </h1>

            <p className="hero-subtitle">
              Access your personal AI assistant designed to handle complexity
              with elegance.
            </p>
          </div>
        </div>
      </div>

      {/* --- Right Side: Form --- */}
      <div className="right-panel">
        <div className="form-wrapper">
          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Please enter your details to sign in.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)", // Dark red transparent
                color: "#fca5a5", // Light red text
                border: "1px solid rgba(239, 68, 68, 0.3)",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label>Password</label>
                <a href="#" className="forgot-link">
                  Forgot password?
                </a>
              </div>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Log In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="footer-link">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>

      {/* Simple Inline Animation for Loader */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
