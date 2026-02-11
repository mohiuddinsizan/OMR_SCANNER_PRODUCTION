import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Login — Scanova";
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await login({ phone, password });
      navigate("/organization");
    } catch (e2) {
      setErr(e2?.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">Scanova</div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                className="input" 
                type="tel"
                placeholder="Enter your phone number" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                className="input" 
                type="password"
                placeholder="Enter your password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {err && <div className="error-message">{err}</div>}

            <button 
              className="auth-submit" 
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create one now</Link>
          </div>
        </div>

        <div className="back-link">
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}