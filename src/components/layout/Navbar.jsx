import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import logo from "/logo.png";
import "../../styles/Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const displayName =
    user?.full_name ||
    user?.name ||
    user?.email ||
    user?.phone ||
    "";

  const firstName = displayName
    ? String(displayName).trim().split(/\s+/)[0]
    : "User";

  const closeMenu = () => setIsMenuOpen(false);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    
    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Brand */}
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <div className="navbar-brand-wrapper">
              <img
                src={logo}
                alt="Scanova Logo"
                className="navbar-logo-img"
              />
              <div className="navbar-brand-text">
                <span className="navbar-logo">Scanova</span>
                <span className="navbar-tagline">Makes Evaluation Easier</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
            <div className="navbar-links-wrapper">
              <a href="/" className="navbar-link" onClick={closeMenu}>Home</a>
              <a href="/#pricing" className="navbar-link" onClick={closeMenu}>Pricing</a>
              <a href="/#services" className="navbar-link" onClick={closeMenu}>Services</a>
              <a href="/#tutorials" className="navbar-link" onClick={closeMenu}>Tutorials</a>
              <Link to="/about-us" className="navbar-link" onClick={closeMenu}>About Us</Link>
              <Link to="/contact-us" className="navbar-link" onClick={closeMenu}>Contact Us</Link>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="navbar-actions">
            {user ? (
              <>
                <span className="navbar-user">
                  Hi, {firstName}
                </span>
                <Link to="/organization" className="btn btn-sm btn-outline">
                  Organization
                </Link>
                <button onClick={logout} className="btn btn-sm btn-outline">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-sm btn-outline">
                  Login
                </Link>
                <Link to="/register" className="btn btn-sm btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button 
            className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="navbar-overlay" onClick={closeMenu}></div>
      )}
    </nav>
  );
}