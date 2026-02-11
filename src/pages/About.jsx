import { Link } from "react-router-dom";
import "../styles/About.css";

export default function About() {
  document.title = "About us — Scanova";

  return (
    <main className="about-page">
      <div className="container">
        {/* Top Header */}
        <header className="about-header">
          <div className="about-badge">About Scanova</div>

          <h1 className="about-title">
            Phone-based <span className="about-highlight">OMR Scanning</span> that feels instant.
          </h1>

          <p className="about-lead">
            Scanova helps institutions generate exam results in seconds—using only a phone camera.
            No dedicated scanner. No complicated setup. Just fast, accurate, and organized evaluation.
          </p>

          <div className="about-actions">
            <a className="btn btnPrimary" href="/#pricing">See Plans</a>
            <Link className="btn btnSecondary" to="/contact-us">Request a Demo</Link>
          </div>
        </header>

        {/* Two-language value section */}
        <section className="about-two-col">
          <div className="about-card">
            <div className="about-card-title">Why Scanova (English)</div>
            <p className="about-text">
              Scanova is built for coaching centers, schools, universities, and training programs
              that want to evaluate faster—without buying extra hardware. You can create customizable
              OMR templates, scan sheets with a phone photo, and publish results immediately. Every
              exam stays stored and downloadable anytime.
            </p>

            <ul className="about-list">
              <li><b>Phone-only scanning:</b> take a photo and get results instantly</li>
              <li><b>Custom OMR:</b> support roll/set/version/subject codes and flexible layouts</li>
              <li><b>Accurate detection:</b> reliable scoring with validations</li>
              <li><b>Auto result sharing:</b> send results to students quickly</li>
              <li><b>Leaderboards:</b> multiple exams per course, ranked performance</li>
              <li><b>Always available:</b> results stored securely, downloadable anytime</li>
            </ul>
          </div>

          <div className="about-card">
            <div className="about-card-title">কেন Scanova (বাংলা)</div>
            <p className="about-text">
              Scanova হলো একটি ফোন-ভিত্তিক OMR সলিউশন, যেখানে আলাদা স্ক্যানার লাগবে না।
              শুধু মোবাইল দিয়ে OMR শিটের ছবি তুলুন—আর কয়েক সেকেন্ডেই রেজাল্ট তৈরি।
              আপনি কাস্টমাইজড টেমপ্লেট বানাতে পারবেন, একাধিক এক্সাম ম্যানেজ করতে পারবেন,
              লিডারবোর্ড রাখতে পারবেন, এবং যেকোনো সময় রেজাল্ট ডাউনলোড করতে পারবেন।
            </p>

            <ul className="about-list">
              <li><b>ফোন দিয়ে স্ক্যান:</b> ছবি তুলুন, সাথে সাথে রেজাল্ট</li>
              <li><b>কাস্টম OMR:</b> রোল/সেট/ভার্সন/সাবজেক্ট কোড সাপোর্ট</li>
              <li><b>উচ্চ নির্ভুলতা:</b> সঠিক মার্কিং ডিটেকশন ও স্কোরিং</li>
              <li><b>রেজাল্ট শেয়ার:</b> দ্রুত স্টুডেন্টদের কাছে পাঠানো</li>
              <li><b>লিডারবোর্ড:</b> একই কোর্সে একাধিক এক্সাম ট্র্যাক</li>
              <li><b>ডাউনলোড যেকোনো সময়:</b> সব রেজাল্ট সংরক্ষিত থাকবে</li>
            </ul>
          </div>
        </section>

        {/* Stats / Proof */}
        <section className="about-metrics">
          <div className="metric">
            <div className="metric-value">⚡ Seconds</div>
            <div className="metric-label">to generate results after a scan</div>
          </div>
          <div className="metric">
            <div className="metric-value">📱 Phone</div>
            <div className="metric-label">only — no scanner required</div>
          </div>
          <div className="metric">
            <div className="metric-value">🧩 Custom</div>
            <div className="metric-label">templates for any institution</div>
          </div>
          <div className="metric">
            <div className="metric-value">⬇️ Anytime</div>
            <div className="metric-label">downloadable stored results</div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="about-cta">
          <div className="about-cta-card">
            <h2 className="about-cta-title">Ready to make evaluation effortless?</h2>
            <p className="about-cta-text">
              Start with Scanova and turn paper-based exams into clean, fast results—without extra devices.
              Try it for your institution and feel the speed.
            </p>

            <div className="about-actions">
              <a className="btn btnPrimary" href="/#pricing">Choose a Plan</a>
              <Link className="btn btnSecondary" to="/contact-us">Talk to Sales</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
