import { Link } from "react-router-dom";
import "../../styles/Hero.css";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-subtitle">Professional OMR Solution</div>
            
            <h1 className="h1">Fast, Accurate OMR Scanning for Institutions</h1>
            
            <p className="hero-description">
              Automate exam evaluation, reporting, and analytics with enterprise-grade reliability. 
              Built for scale, precision, and seamless workflows.
            </p>

            <div className="hero-actions">
              <a className="btn btnPrimary btnLarge" href="#pricing">
                View Subscription Plans
              </a>
              <Link className="btn btnSecondary btnLarge" to="/contact-us">
                Request Demo
              </Link>
            </div>

            <div className="hero-features">
              <div className="feature-chip">Bank-Grade Security</div>
              <div className="feature-chip">Lightning Fast</div>
              <div className="feature-chip">Advanced Analytics</div>
              {/* <div className="feature-chip">Cloud-Ready</div> */}
            </div>
          </div>

          <div className="hero-card">
            <h3 className="hero-card-title">What You Can Do</h3>

            <div className="hero-card-list">
              <div className="hero-card-item">
                Take a photo of the OMR sheet with your phone—Scanova does the rest
              </div>
              <div className="hero-card-item">
                Create multiple exams per course and maintain leaderboards automatically
              </div>
              <div className="hero-card-item">
                Generate results instantly and send to students in one click
              </div>
              <div className="hero-card-item">
                Store all scanned results securely & download anytime (PDF/CSV/Excel)
              </div>
              <div className="hero-card-item">
                Support customizable OMR: bubbles, roll, set, version, and subject codes
              </div>
            </div>

            <div className="hero-tip">
              <div className="hero-tip-title">Built for Institutions</div>
              <div className="hero-tip-text">
                Perfect for coaching centers, schools, universities, and training programs that
                need fast, reliable evaluation at scale—with only a phone.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}