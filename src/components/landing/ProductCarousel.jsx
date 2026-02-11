import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../../styles/Productcarousel.css";

export default function ProductCarousel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ Safe display name (backend likely returns full_name, not name)
  const displayName =
    user?.full_name || user?.name || user?.email || user?.phone || "User";
  const firstName = String(displayName).trim().split(/\s+/)[0] || "User";

  const plans = useMemo(
    () => [
      {
        name: "Starter",
        price: "$19",
        period: "/month",
        badge: "Best for Pilots",
        gradient: "linear-gradient(135deg, #dbeafe, #f0f9ff)",
        accentColor: "#2563eb",
        features: [
          "Basic OMR scanning",
          "CSV export only",
          "Email support",
          "Up to 1,000 sheets/mo",
        ],
        popular: false,
      },
      {
        name: "Professional",
        price: "$49",
        period: "/month",
        badge: "Most Popular",
        gradient: "linear-gradient(135deg, #d1fae5, #ecfdf5)",
        accentColor: "#10b981",
        features: [
          "Batch processing",
          "PDF & CSV reports",
          "Priority support",
          "Up to 10,000 sheets/mo",
        ],
        popular: true,
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "pricing",
        badge: "High Traffic",
        gradient: "linear-gradient(135deg, #fef3c7, #fef9c3)",
        accentColor: "#f59e0b",
        features: [
          "Custom SLA",
          "Dedicated workflows",
          "24/7 support",
          "Unlimited sheets",
        ],
        popular: false,
      },
      {
        name: "Institution",
        price: "$99",
        period: "/month",
        badge: "For Campuses",
        gradient: "linear-gradient(135deg, #ede9fe, #f5f3ff)",
        accentColor: "#8b5cf6",
        features: [
          "Multi-admin access",
          "Role-based permissions",
          "Audit logs",
          "Up to 50,000 sheets/mo",
        ],
        popular: false,
      },
      {
        name: "Custom",
        price: "Contact",
        period: "us",
        badge: "Fully Tailored",
        gradient: "linear-gradient(135deg, #e0e7ff, #eef2ff)",
        accentColor: "#6366f1",
        features: [
          "Custom templates",
          "Dedicated infrastructure",
          "Implementation support",
          "Volume pricing",
        ],
        popular: false,
      },
    ],
    []
  );

  function buy(planName) {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    alert(
      `✅ Logged in as ${displayName}.\nPurchase flow for "${planName}" will be implemented soon.`
    );
  }

  const items = [...plans, ...plans, ...plans];

  return (
    <section className="pricing-section">
      <div className="container">
        <div className="pricing-header">
          <div className="pricing-title-group">
            <h2>Choose Your Perfect Plan</h2>
            <p className="pricing-subtitle">
              Flexible subscription options designed for institutions of all
              sizes. Hover over cards to pause the carousel.
            </p>
          </div>
          <a className="btn btnSecondary" href="#services">
            Explore Services →
          </a>
        </div>

        <div className="marquee-wrapper fade-edges">
          <div className="marquee-track">
            {items.map((plan, idx) => (
              <div
                key={`${plan.name}-${idx}`}
                className={`plan-card ${plan.popular ? "popular" : ""}`}
                style={{
                  background: plan.gradient,
                  color: plan.accentColor,
                  "--accent": plan.accentColor,
                }}
              >
                <style>{`
                  .plan-card[style*="${plan.accentColor}"]::before {
                    background: ${plan.accentColor};
                  }
                  .plan-card[style*="${plan.accentColor}"] .plan-feature::before {
                    background: ${plan.accentColor}20;
                    color: ${plan.accentColor};
                  }
                `}</style>

                <div
                  className="plan-badge"
                  style={{
                    borderColor: plan.accentColor,
                    color: plan.accentColor,
                  }}
                >
                  {plan.badge}
                </div>

                <div className="plan-header">
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price-group">
                    <span
                      className="plan-price"
                      style={{ color: plan.accentColor }}
                    >
                      {plan.price}
                    </span>
                    <div className="plan-period">{plan.period}</div>
                  </div>
                </div>

                <div className="plan-features">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="plan-feature"
                      style={{ "--feature-color": plan.accentColor }}
                    >
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="plan-action">
                  <button
                    className="plan-cta"
                    onClick={() => buy(plan.name)}
                    style={{
                      background: plan.accentColor,
                      borderColor: plan.accentColor,
                      color: "white",
                    }}
                  >
                    {plan.price === "Custom" || plan.price === "Contact"
                      ? "Contact Sales"
                      : "Subscribe Now"}
                  </button>
                  <div className="plan-status">
                    {user ? `✓ Logged in as ${firstName}` : "⚠ Login required"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="enterprise-cta">
          <h3 className="enterprise-cta-title">Need Enterprise Pricing?</h3>
          <p className="enterprise-cta-text">
            Contact our sales team for custom SLA agreements, dedicated
            infrastructure, and volume pricing tailored to your institution's
            needs.
          </p>
        </div>
      </div>
    </section>
  );
}
