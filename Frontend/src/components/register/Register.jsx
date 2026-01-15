import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bot, 
  Sparkles, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

const Register = () => {
  // --- State Management ---
  // strictly limited to the properties needed for your JSON format
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // --- Handlers ---
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Constructing the payload EXACTLY as requested
      const payload = {
        fullname: {
          firstName: formData.firstName,
          lastName: formData.lastName
        },
        email: formData.email,
        password: formData.password
      };

      // 2. API Call
      const response = await axios.post('http://localhost:3000/api/auth/register', 
        payload,
        {
          withCredentials: true // Include if your backend handles cookies/sessions
        }
      );

      // 3. Success Handling
      console.log('Registration Success:', response.data);
      toast.success('Registration successful!');
      navigate('/login');

    } catch (err) {
      // 4. Error Handling
      console.error('Registration Error:', err);
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      {/* --- Left Panel --- */}
      <div className="left-panel">
        <div className="left-content">
          <div className="brand">
            <div className="brand-icon">
              <Bot size={24} color="#fff" />
            </div>
            <span>Promptly</span>
          </div>

          <div className="hero-text-container">
            <h1 className="hero-title">
              Instant AI <br />
              <span className="gradient-text">Assistance.</span>
            </h1>
            <p className="hero-subtitle">
              Unlock the power of neural networks. Join thousands of creators 
              and developers experiencing the future of communication today.
            </p>
            <div className="glass-card">
              <div className="ai-icon-circle">
                <Sparkles size={20} />
              </div>
              <div className="chat-content">
                <p className="chat-text">How can I help you optimize your code today?</p>
                <span className="typing-cursor"></span>
              </div>
            </div>
          </div>
          <p className="footer-copy">© 2026 Promptly Inc. All rights reserved.</p>
        </div>
      </div>

      {/* --- Right Panel (Form) --- */}
      <div className="right-panel">
        <div className="form-wrapper">
          
          <div className="form-header">
            <h2>Create your account</h2>
            <p>Get started with your free AI companion today.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2', 
              color: '#ef4444', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            
            {/* Split Row for First Name and Last Name */}
            <div className="row-split">
              <div className="form-group" style={{flex: 1}}>
                <label>First Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input 
                    type="text" 
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jane" 
                    className="form-input" 
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{flex: 1}}>
                <label>Last Name</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input 
                    type="text" 
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe" 
                    className="form-input" 
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@example.com" 
                  className="form-input" 
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  className="form-input" 
                  required
                  minLength={6}
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
              style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{animation: 'spin 1s linear infinite'}} />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="login-link">
              Already have an account? <Link to="/login">Log In</Link>
            </p>
          </form>
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

export default Register;