// src/components/landing/Services.jsx
import "../../styles/Services.css";

export default function Services() {
  // ✅ Focused services for your real OMR product (removed AWS/Cloud/extra fluff)
  const services = [
    {
      title: "Phone Photo Scanning",
      text: "No extra scanner needed. Just capture an OMR sheet photo with your phone and get results instantly.",
      color: "#2563eb",
      icon: "📱",
    },
    {
      title: "Customizable OMR Templates",
      text: "Build your own OMR formats: question count, bubble styles, roll/set/version fields, and subject/course mapping.",
      color: "#8b5cf6",
      icon: "🧩",
    },
    {
      title: "Accurate Evaluation",
      text: "High-precision detection and validation for clean, reliable scoring—even for large batches.",
      color: "#10b981",
      icon: "🎯",
    },
    {
      title: "Instant Results + Auto Sharing",
      text: "Generate results super fast and send them directly to students via your workflow (portal/export/share).",
      color: "#f59e0b",
      icon: "⚡",
    },
    {
      title: "Leaderboards & Multi-Exam Tracking",
      text: "Create multiple exams per course and maintain performance history with rankings and exam-wise analytics.",
      color: "#2563eb",
      icon: "🏆",
    },
    {
      title: "Stored Forever + Download Anytime",
      text: "Every scan and result stays saved. Download results anytime in PDF/CSV/Excel with one click.",
      color: "#f59e0b",
      icon: "⬇️",
    },
  ];

  return (
    <section className="services-section">
      <div className="container">
        <div className="services-header">
          <h2>Everything You Need for Fast OMR Results</h2>
          <p className="services-description">
            Scanova is built for speed and simplicity: capture, evaluate, store, share, and track performance—using only a phone.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <div
              key={service.title}
              className="service-card"
              style={{
                color: service.color,
              }}
            >
              <style>{`
                .service-card[style*="${service.color}"]::before {
                  background: ${service.color};
                }
                .service-card[style*="${service.color}"] .service-icon {
                  background: ${service.color}15;
                  border: 2px solid ${service.color}30;
                }
              `}</style>

              <div className="service-icon">{service.icon}</div>

              <h3 className="service-title">{service.title}</h3>
              <p className="service-text">{service.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
