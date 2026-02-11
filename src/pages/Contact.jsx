import { useEffect, useMemo, useState } from "react";
import "../styles/Contact.css";

export default function Contact() {
  useEffect(() => {
    document.title = "Contact us — Scanova";
  }, []);

  // ✅ Your receiving email (edit anytime)
  const TO_EMAIL = "mohiuddinsizan13@gmail.com";

  const [form, setForm] = useState({
    name: "",
    organization: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState({ type: "", msg: "" });

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  // ✅ Build email subject + body (English + Bangla)
  const emailSubject = useMemo(() => {
    const base = form.subject?.trim() || "Scanova Inquiry";
    const org = form.organization?.trim();
    return org ? `[${org}] ${base}` : base;
  }, [form.subject, form.organization]);

  const emailBody = useMemo(() => {
    const lines = [
      "Hello Scanova Team,",
      "",
      "I would like to get in touch regarding Scanova.",
      "",
      "— Contact Details —",
      `Name: ${form.name || "-"}`,
      `Organization: ${form.organization || "-"}`,
      `Email: ${form.email || "-"}`,
      `Phone: ${form.phone || "-"}`,
      "",
      "— Message (English) —",
      `${form.message || "-"}`,
      "",
      "Thanks,",
      form.name || "Sender",
    ];

    return lines.join("\n");
  }, [form.name, form.organization, form.email, form.phone, form.message]);

  // ✅ mailto link
  const mailtoHref = useMemo(() => {
    const params = new URLSearchParams({
      subject: emailSubject,
      body: emailBody,
    });
    return `mailto:${TO_EMAIL}?${params.toString()}`;
  }, [TO_EMAIL, emailSubject, emailBody]);

  function onSubmit(e) {
    e.preventDefault();

    // show message + open email compose
    setStatus({
      type: "success",
      msg: "Opening your email composer with the prepared message…",
    });

    // open compose window
    window.location.href = mailtoHref;
  }

  return (
    <main className="contact-page">
      <div className="container">
        {/* Header */}
        <header className="contact-header">
          <div className="contact-badge">Contact Scanova</div>
          <h1 className="contact-title">Let’s talk about your institution</h1>
          <p className="contact-lead">
            Click “Send Email” to open Gmail (or your default email app) with a prepared message.
            Just review and press Send.
          </p>
        </header>

        <section className="contact-grid">
          {/* Left: form */}
          <div className="contact-card">
            <div className="contact-card-title">Send an email</div>
            <p className="contact-card-subtitle">
              Fill in the form. We’ll open your email with everything pre-filled.
            </p>

            <form className="contact-form" onSubmit={onSubmit}>
              <div className="contact-row">
                <div className="contact-field">
                  <label className="contact-label">Your Name</label>
                  <input
                    className="contact-input"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label className="contact-label">Organization</label>
                  <input
                    className="contact-input"
                    value={form.organization}
                    onChange={(e) => setField("organization", e.target.value)}
                    placeholder="School / Coaching / University"
                  />
                </div>
              </div>

              <div className="contact-row">
                <div className="contact-field">
                  <label className="contact-label">Email</label>
                  <input
                    className="contact-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label className="contact-label">Phone</label>
                  <input
                    className="contact-input"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+8801XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="contact-field">
                <label className="contact-label">Subject</label>
                <input
                  className="contact-input"
                  value={form.subject}
                  onChange={(e) => setField("subject", e.target.value)}
                  placeholder="e.g., Need demo / Pricing / Custom OMR template"
                  required
                />
              </div>

              <div className="contact-field">
                <label className="contact-label">Message</label>
                <textarea
                  className="contact-textarea"
                  value={form.message}
                  onChange={(e) => setField("message", e.target.value)}
                  placeholder="Write your message…"
                  rows={6}
                  required
                />
              </div>

              {status.msg && (
                <div
                  className={`contact-status ${
                    status.type === "success" ? "success" : "error"
                  }`}
                >
                  {status.msg}
                </div>
              )}

              <button className="contact-submit btn btnPrimary" type="submit">
                Send Email
              </button>

              {/* Optional: direct link button (same action) */}
              <a className="contact-secondary-link" href={mailtoHref}>
                Or click here to open email compose →
              </a>

              <div className="contact-note">
                This opens your email composer (Gmail/default mail app). You’ll press Send yourself.
              </div>
            </form>
          </div>

          {/* Right: info */}
          <aside className="contact-side">
            <div className="contact-info-card">
              <div className="contact-info-title">Contact info</div>

              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="contact-info-icon">📩</div>
                  <div>
                    <div className="contact-info-label">Email</div>
                    <div className="contact-info-value">mohiuddinsizan13@gmail.com</div>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">📞</div>
                  <div>
                    <div className="contact-info-label">Phone</div>
                    <div className="contact-info-value">+880 1741929871</div>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">📍</div>
                  <div>
                    <div className="contact-info-label">Address</div>
                    <div className="contact-info-value">
                      Sultan Ahmed Plaza (6th Floor), Purana Paltan, Dhaka, Bangladesh
                    </div>
                  </div>
                </div>
              </div>

              <div className="contact-mini-cta">
                <div className="contact-mini-title">What to write?</div>
                <ul className="contact-mini-list">
                  <li>How many students/exams you run monthly</li>
                  <li>Your current OMR format & question count</li>
                  <li>Whether you want auto-send results / leaderboard</li>
                  <li>If you need custom fields: roll/set/version/subject</li>
                </ul>
              </div>
            </div>

            <div className="contact-faq-card">
              <div className="contact-info-title">Quick answers</div>

              <div className="contact-faq">
                <div className="contact-q">Do I need a scanner?</div>
                <div className="contact-a">
                  No — Scanova works with a phone photo. Great for fast setups.
                </div>
              </div>

              <div className="contact-faq">
                <div className="contact-q">Can I customize OMR templates?</div>
                <div className="contact-a">
                  Yes — you can create formats based on your institution’s needs.
                </div>
              </div>

              <div className="contact-faq">
                <div className="contact-q">Can I download results anytime?</div>
                <div className="contact-a">
                  Yes — results stay stored and can be exported anytime.
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
