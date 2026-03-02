// src/components/exams/TemplatePickerModal.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../lib/api";
import "../../styles/TemplatePickerModal.css";

function clampText(text, max = 90) {
  const s = String(text || "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export default function TemplatePickerModal({
  isOpen,
  onClose,
  onPick,
  title = "Select Template",
  showToast,
}) {
  const PAGE_SIZE = 12;

  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const debounceRef = useRef(null);

  function toast(msg, type = "success") {
    if (typeof showToast === "function") showToast(msg, type);
    else console.log(type.toUpperCase() + ":", msg);
  }

  async function loadPage({ reset = false } = {}) {
    const name = search.trim();
    const nextSkip = reset ? 0 : skip;

    if (reset) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const { data } = await api.get("/templates/org", {
        params: {
          skip: nextSkip,
          limit: PAGE_SIZE,
          ...(name ? { name } : {}),
        },
      });

      const list = Array.isArray(data) ? data : [];

      if (reset) setItems(list);
      else setItems((p) => [...p, ...list]);

      setSkip(nextSkip + list.length);
      setHasMore(list.length === PAGE_SIZE);
    } catch (err) {
      setHasMore(false);
      toast(err?.response?.data?.detail || err?.message || "Failed to load templates.", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  // Reset and reload on open
  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setItems([]);
    setSkip(0);
    setHasMore(true);
    setLoading(true);
    setLoadingMore(false);
    setBusyId(null);
    loadPage({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setItems([]);
      setSkip(0);
      setHasMore(true);
      loadPage({ reset: true });
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isOpen]);

  // Esc key
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === "Escape") onClose?.(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  async function pickTemplate(templateId) {
    if (!templateId) return;
    setBusyId(templateId);
    try {
      const { data } = await api.get(`/templates/org/${templateId}`);
      onPick?.(data);
      onClose?.();
    } catch (err) {
      toast(err?.response?.data?.detail || err?.message || "Failed to select template.", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (!isOpen) return null;

  const displayTitle = search.trim() ? `${title} (filtered)` : title;

  const modal = (
    <div
      className="tpm-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="tpm-modal" onMouseDown={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="tpm-header">
          <div className="tpm-header-left">
            <h3>{displayTitle}</h3>
            <p>Pick an organization-owned template. Press <b>Esc</b> to close.</p>
          </div>
          <button
            type="button"
            className="tpm-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* ── Search ── */}
        <div className="tpm-filters">
          <div className="tpm-search-wrap">
            <span className="tpm-search-label">Search by name</span>
            <div className="tpm-search-field">
              <svg
                className="tpm-search-icon"
                width="16" height="16"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
              >
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="tpm-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. HSC MCQ v2…"
              />
            </div>
          </div>

          <button
            type="button"
            className="tpm-btn tpm-btn-ghost"
            onClick={() => {
              setItems([]); setSkip(0); setHasMore(true);
              loadPage({ reset: true });
            }}
            disabled={loading || loadingMore}
          >
            ↻ Refresh
          </button>
        </div>

        {/* ── Body ── */}
        <div className="tpm-body">
          {loading ? (
            <div className="tpm-loading">
              <div className="tpm-spinner" />
              <div className="tpm-loading-text">Loading templates…</div>
            </div>
          ) : items.length === 0 ? (
            <div className="tpm-empty">
              <div style={{ fontSize: 38 }}>📭</div>
              <div className="tpm-empty-title">No owned templates found</div>
              <div className="tpm-empty-sub">
                Buy a global template in Template Manager first, then return here to select it.
              </div>
            </div>
          ) : (
            <>
              <div className="tpm-grid">
                {items.map((t) => {
                  const isBusy = busyId === t.id;
                  return (
                    <div key={t.id} className="tpm-card">
                      {/* Preview */}
                      <div className="tpm-card-preview">
                        {t.preview_image_url ? (
                          <img src={t.preview_image_url} alt={t.name || "Template"} loading="lazy" />
                        ) : (
                          <div className="tpm-card-preview-empty">
                            <div className="tpm-card-preview-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                  d="M4 7h16M4 12h16M4 17h10" />
                              </svg>
                            </div>
                            <span className="tpm-card-preview-label">No preview</span>
                          </div>
                        )}
                        <span className="tpm-card-badge">✓ Owned</span>
                      </div>

                      {/* Body */}
                      <div className="tpm-card-body">
                        <div className="tpm-card-name">{t.name || "Untitled Template"}</div>

                        <div className="tpm-card-meta">
                          <span className="tpm-card-meta-chip">v{t.version || "—"}</span>
                          <span className="tpm-card-meta-chip">#{String(t.id).slice(0, 6)}…</span>
                        </div>

                        {t.description
                          ? <div className="tpm-card-desc">{clampText(t.description, 80)}</div>
                          : <div className="tpm-card-desc-empty">No description</div>
                        }

                        <button
                          type="button"
                          className={`tpm-btn tpm-btn-select${isBusy ? " busy" : ""}`}
                          onClick={() => pickTemplate(t.id)}
                          disabled={isBusy}
                          style={{ marginTop: "auto", width: "100%" }}
                        >
                          {isBusy ? (
                            <>
                              <span style={{
                                width: 13, height: 13,
                                border: "2px solid rgba(37,99,235,0.2)",
                                borderTopColor: "#2563eb",
                                borderRadius: "50%",
                                display: "inline-block",
                                animation: "tpmSpin 0.75s linear infinite",
                              }} />
                              Selecting…
                            </>
                          ) : "Select →"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="tpm-more">
                {hasMore ? (
                  <button
                    type="button"
                    className="tpm-btn tpm-btn-ghost"
                    onClick={() => loadPage({ reset: false })}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <span style={{
                          width: 13, height: 13,
                          border: "2px solid #e5e7eb",
                          borderTopColor: "#6b7280",
                          borderRadius: "50%",
                          display: "inline-block",
                          animation: "tpmSpin 0.75s linear infinite",
                        }} />
                        Loading…
                      </>
                    ) : "Load more templates"}
                  </button>
                ) : (
                  <div className="tpm-end-label">All templates loaded</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="tpm-footer">
          <span className="tpm-footer-count">
            {loading ? "Loading…" : `${items.length} template${items.length !== 1 ? "s" : ""} shown`}
          </span>
          <button type="button" className="tpm-btn tpm-btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}