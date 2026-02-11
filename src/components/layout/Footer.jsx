import { Link } from "react-router-dom";
import "../../styles/Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">Scanova</div>
              <p className="footer-tagline">
                Enterprise-grade OMR scanning and exam automation platform. 
                Trusted by educational institutions worldwide for accuracy, 
                reliability, and scale.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="Twitter">𝕏</a>
                <a href="#" className="social-link" aria-label="LinkedIn">in</a>
                <a href="https://github.com/mohiuddinsizan" className="social-link" aria-label="GitHub">⚡</a>
                <a href="/contact-us" className="social-link" aria-label="Email">✉</a>
              </div>
            </div>

            <div>
              <h4 className="footer-section-title">Company</h4>
              <div className="footer-links">
                <Link to="/about-us" className="footer-link">About Us</Link>
                <Link to="/contact-us" className="footer-link">Contact Us</Link>
                <a href="#" className="footer-link">Careers</a>
                <a href="#" className="footer-link">Blog</a>
              </div>
            </div>

            <div>
              <h4 className="footer-section-title">Product</h4>
              <div className="footer-links">
                <a href="/#pricing" className="footer-link">Pricing</a>
                <a href="/#services" className="footer-link">Services</a>
                <a href="/#tutorials" className="footer-link">Tutorials</a>
                <a href="/" className="footer-link">Documentation</a>
              </div>
            </div>

            <div>
              <h4 className="footer-section-title">Support</h4>
              <div className="footer-links">
                <a href="/contact-us" className="footer-link">Help Center</a>
                {/* <a href="#" className="footer-link">API Reference</a> */}
                <a href="/" className="footer-link">System Status</a>
                <a href="/about-us" className="footer-link">Release Notes</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-copyright">
              © {currentYear} Scanova. All rights reserved.
            </div>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}