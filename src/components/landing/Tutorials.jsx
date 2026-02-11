import "../../styles/Tutorials.css";

export default function Tutorials() {
  return (
    <section className="tutorials-section">
      <div className="container">
        <div className="tutorials-header">
          <h2>Video Tutorials</h2>
          <p className="p">
            Watch our comprehensive video guides to get started with Scanova quickly
          </p>
        </div>

        <div className="tutorials-grid">
          <div className="tutorial-video-card">
            <div className="video-wrapper">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Getting Started with Scanova"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="tutorial-info">
              <h3 className="tutorial-title">Getting Started Guide</h3>
              <p className="tutorial-description">
                Learn the basics of OMR sheet setup, scanning, and generating your first reports in under 10 minutes.
              </p>
              <div className="tutorial-meta">
                <span className="tutorial-duration">⏱ 8:30</span>
                <span className="tutorial-views">👁 2.4K views</span>
              </div>
            </div>
          </div>

          <div className="tutorial-video-card">
            <div className="video-wrapper">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Advanced Features Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="tutorial-info">
              <h3 className="tutorial-title">Advanced Features</h3>
              <p className="tutorial-description">
                Explore batch processing, custom templates, analytics dashboard, and API integrations for power users.
              </p>
              <div className="tutorial-meta">
                <span className="tutorial-duration">⏱ 12:45</span>
                <span className="tutorial-views">👁 1.8K views</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}