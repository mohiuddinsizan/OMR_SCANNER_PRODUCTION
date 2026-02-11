import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });
    const [err, setErr] = useState("");
    const [ok, setOk] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        document.title = "Register — Scanova";
    }, []);

    function setField(k, v) {
        setForm((p) => ({ ...p, [k]: v }));
    }

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        setOk("");
        setLoading(true);

        try {
            await register(form);
            setOk("Registration successful! Redirecting to login...");
            setTimeout(() => navigate("/login"), 1500);
        } catch (e2) {
            const detail = e2?.response?.data?.detail;

            if (Array.isArray(detail)) {
                setErr(detail.map(d => d.msg).join(", "));
            } else if (typeof detail === "string") {
                setErr(detail);
            } else {
                setErr("Registration failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page register-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">Scanova</div>
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Join thousands of institutions using Scanova</p>
                    </div>

                    <form onSubmit={onSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                className="input"
                                type="text"
                                placeholder="Enter your full name"
                                value={form.full_name}
                                onChange={(e) => setField("full_name", e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input
                                    className="input"
                                    type="tel"
                                    placeholder="Phone"
                                    value={form.phone}
                                    onChange={(e) => setField("phone", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email (Optional)</label>
                                <input
                                    className="input"
                                    type="email"
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={(e) => setField("email", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="input"
                                type="password"
                                placeholder="Create a strong password"
                                value={form.password}
                                onChange={(e) => setField("password", e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {err && <div className="error-message">{err}</div>}
                        {ok && <div className="success-message">{ok}</div>}

                        <button
                            className="auth-submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <div className="features-list">
                        <div className="feature-item">14-day free trial, no credit card required</div>
                        <div className="feature-item">Access to all basic features</div>
                        <div className="feature-item">Cancel anytime, no questions asked</div>
                    </div>

                    <div className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>

                <div className="back-link">
                    <a href="/">← Back to Home</a>
                </div>
            </div>
        </div>
    );
}