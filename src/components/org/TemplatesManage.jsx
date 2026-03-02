// src/pages/TemplatesManage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/api";
import "../../styles/TemplatesManage.css";

/* ─────────────────────────────────────────────────── */
/*  Helpers                                             */
/* ─────────────────────────────────────────────────── */

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return "—"; }
}

function clampText(text, max = 120) {
  const s = String(text || "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/* ─────────────────────────────────────────────────── */
/*  Image Lightbox                                      */
/* ─────────────────────────────────────────────────── */

function ImageLightbox({ isOpen, src, alt, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  return (
    <div className="tm-lightbox-backdrop" onClick={onClose}>
      <div className="tm-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <div className="tm-lightbox-topbar">
          <span className="tm-lightbox-title">{alt}</span>
          <button className="tm-lightbox-close" onClick={onClose}>×</button>
        </div>
        <img src={src} alt={alt} className="tm-lightbox-img" />
        <p className="tm-lightbox-hint">Press Esc or click outside to close</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Download icon buttons                               */
/* ─────────────────────────────────────────────────── */

function DownloadBtn({ label, icon, busy, onClick }) {
  return (
    <button
      className="tm-btn tm-btn-ghost tm-btn-mini"
      type="button"
      onClick={onClick}
      disabled={busy}
      title={label}
    >
      <span>{icon}</span>
      <span>{busy ? "…" : label}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Template Card                                       */
/* ─────────────────────────────────────────────────── */

function TemplateCard({ template, kind, canUpload, canBuy, onBuy, onDownload, onUpload, busyMap }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState(null);
  const [loadingFullImage, setLoadingFullImage] = useState(false);

  const id = template?.id;
  const preview = template?.preview_image_url || "";
  const name = template?.name || "Untitled Template";
  const desc = template?.description || "";
  const version = template?.version || "—";
  const locked = !!template?.is_delete_locked;

  async function handlePreviewClick() {
    if (!id) return;
    if (fullImageUrl) { setLightboxOpen(true); return; }
    setLoadingFullImage(true);
    try {
      const base = kind === "global" ? `/templates/global/${id}` : `/templates/org/${id}`;
      const { data } = await api.get(`${base}/files/image`);
      const url = data?.url || preview;
      setFullImageUrl(url);
      setLightboxOpen(true);
    } catch {
      if (preview) { setFullImageUrl(preview); setLightboxOpen(true); }
    } finally {
      setLoadingFullImage(false);
    }
  }

  return (
    <>
      <ImageLightbox
        isOpen={lightboxOpen}
        src={fullImageUrl || preview}
        alt={name}
        onClose={() => setLightboxOpen(false)}
      />

      <div className="tm-card">
        {/* Preview */}
        <div
          className="tm-card-preview"
          style={{ cursor: preview ? "zoom-in" : "default" }}
          onClick={preview ? handlePreviewClick : undefined}
          title={preview ? "Click to view full size" : "No preview available"}
        >
          {preview ? (
            <img src={preview} alt={name} loading="lazy" />
          ) : (
            <div className="tm-card-preview-placeholder">
              <div className="tm-ph-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    d="M4 7h16M4 12h16M4 17h10" />
                </svg>
              </div>
              <div className="tm-ph-text">No preview</div>
            </div>
          )}

          {loadingFullImage && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "inherit",
            }}>
              <div style={{
                width: 22, height: 22,
                border: "3px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "tmSpin 0.8s linear infinite",
              }} />
            </div>
          )}

          {preview && !loadingFullImage && (
            <div className="tm-preview-zoom-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
              View Full
            </div>
          )}

          {/* Badges */}
          <div className="tm-card-badges">
            <span className={`tm-badge ${kind === "global" ? "tm-badge-global" : "tm-badge-org"}`}>
              {kind === "global" ? "Global" : "Owned"}
            </span>
            {locked && <span className="tm-badge tm-badge-locked">🔒 Locked</span>}
          </div>
        </div>

        {/* Body */}
        <div className="tm-card-body">
          <div className="tm-card-title">{name}</div>

          {desc
            ? <div className="tm-card-desc">{clampText(desc, 130)}</div>
            : <div className="tm-card-desc tm-muted">No description provided</div>
          }

          <div className="tm-card-meta">
            <span className="tm-meta-chip">v{version}</span>
            <span className="tm-meta-chip tm-muted">Updated {formatDate(template?.updated_at)}</span>
          </div>

          {/* Download buttons */}
          <div className="tm-card-actions">
            <DownloadBtn
              label="PDF" icon="📄"
              busy={!!busyMap?.[`${id}:download:pdf`]}
              onClick={() => onDownload(kind, id, "pdf")}
            />
            <DownloadBtn
              label="AI File" icon="🎨"
              busy={!!busyMap?.[`${id}:download:illustrator`]}
              onClick={() => onDownload(kind, id, "illustrator")}
            />
            <DownloadBtn
              label="Image" icon="🖼"
              busy={!!busyMap?.[`${id}:download:image`]}
              onClick={() => onDownload(kind, id, "image")}
            />
          </div>

          {/* Buy / Upload */}
          <div className="tm-card-actions-2">
            {canBuy && kind === "global" && (
              <button
                className="tm-btn tm-btn-primary"
                type="button"
                onClick={() => onBuy(id)}
                disabled={!!busyMap?.[`${id}:buy`]}
              >
                {busyMap?.[`${id}:buy`] ? "Adding…" : "＋ Add to Organization"}
              </button>
            )}

            {canUpload && (
              <div className="tm-upload-group">
                {[
                  { type: "image", accept: "image/*", label: "Upload Image" },
                  { type: "pdf", accept: "application/pdf", label: "Upload PDF" },
                  { type: "illustrator", accept: ".ai,application/postscript", label: "Upload AI" },
                ].map(({ type, accept, label }) => (
                  <label
                    key={type}
                    className={`tm-btn tm-btn-secondary${busyMap?.[`${id}:upload:${type}`] ? " tm-disabled" : ""}`}
                    title={label}
                  >
                    {busyMap?.[`${id}:upload:${type}`] ? "Uploading…" : label}
                    <input
                      type="file"
                      accept={accept}
                      disabled={!!busyMap?.[`${id}:upload:${type}`]}
                      onChange={(e) => onUpload(id, type, e.target.files?.[0])}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Section wrapper                                     */
/* ─────────────────────────────────────────────────── */

function TemplateSection({
  title, subtitle, chipText, chipVariant,
  loading, templates, hasMore,
  onLoadMore, onDownload, onUpload, onBuy,
  canUpload, canBuy, kind, busyMap, emptyTitle, emptySub,
  isGuest,
}) {
  return (
    <div className="tm-section">
      <div className="tm-section-header">
        <div>
          <div className="tm-section-title">{title}</div>
          <div className="tm-section-subtitle">{subtitle}</div>
        </div>
        <div className="tm-section-actions">
          {chipText && (
            <span className={`tm-chip${chipVariant === "admin" ? " tm-chip-admin" : ""}`}>
              {chipText}
            </span>
          )}
        </div>
      </div>

      {isGuest ? (
        <div className="tm-empty">
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
          <div className="tm-empty-title">{emptyTitle}</div>
          <div className="tm-empty-sub">{emptySub}</div>
        </div>
      ) : loading ? (
        <div className="tm-loading">
          <div className="tm-spinner" />
          <div style={{ fontSize: 14 }}>Loading templates…</div>
        </div>
      ) : templates.length === 0 ? (
        <div className="tm-empty">
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <div className="tm-empty-title">{emptyTitle}</div>
          <div className="tm-empty-sub">{emptySub}</div>
        </div>
      ) : (
        <>
          <div className="tm-grid">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                kind={kind}
                canUpload={canUpload}
                canBuy={canBuy}
                onBuy={onBuy}
                onDownload={onDownload}
                onUpload={onUpload}
                busyMap={busyMap}
              />
            ))}
          </div>

          {hasMore && (
            <div className="tm-more">
              <button className="tm-btn tm-btn-secondary" type="button" onClick={onLoadMore}>
                Load more {kind === "global" ? "global" : "owned"} templates
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/*  Main Page                                           */
/* ─────────────────────────────────────────────────── */

export default function TemplatesManage({ user, showToast }) {
  const roleName = String(user?.role_name || "").toLowerCase();
  const isSuperAdmin = roleName === "super_admin";
  const isGuestUser = !user?.org_id || roleName === "guest";

  const PAGE_SIZE = 12;

  const [search, setSearch] = useState("");
  const searchDebounceRef = useRef(null);

  const [globalTemplates, setGlobalTemplates] = useState([]);
  const [orgTemplates, setOrgTemplates] = useState([]);

  const [gSkip, setGSkip] = useState(0);
  const [oSkip, setOSkip] = useState(0);

  const [gHasMore, setGHasMore] = useState(true);
  const [oHasMore, setOHasMore] = useState(true);

  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [loadingOrg, setLoadingOrg] = useState(true);

  const [busy, setBusy] = useState({});

  const canReadOrg = !isGuestUser;
  const canUploadGlobal = isSuperAdmin;
  const canUploadOrg = !isGuestUser;
  const canBuy = !isGuestUser;

  function toast(msg, type = "success") {
    if (typeof showToast === "function") showToast(msg, type);
    else console.log(type.toUpperCase() + ":", msg);
  }

  function setBusyKey(key, val) {
    setBusy((prev) => ({ ...prev, [key]: val }));
  }

  async function loadGlobal({ reset = false, name = "" } = {}) {
    const nextSkip = reset ? 0 : gSkip;
    if (reset) { setLoadingGlobal(true); setGHasMore(true); }
    try {
      const { data } = await api.get("/templates/global", {
        params: { skip: nextSkip, limit: PAGE_SIZE, ...(name ? { name } : {}) },
      });
      const list = Array.isArray(data) ? data : [];
      if (reset) setGlobalTemplates(list);
      else setGlobalTemplates((prev) => [...prev, ...list]);
      setGSkip(nextSkip + list.length);
      setGHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      toast(e?.response?.data?.detail || e?.message || "Failed to load global templates.", "error");
      setGHasMore(false);
    } finally {
      setLoadingGlobal(false);
    }
  }

  async function loadOrg({ reset = false, name = "" } = {}) {
    if (!canReadOrg) { setOrgTemplates([]); setLoadingOrg(false); setOHasMore(false); return; }
    const nextSkip = reset ? 0 : oSkip;
    if (reset) { setLoadingOrg(true); setOHasMore(true); }
    try {
      const { data } = await api.get("/templates/org", {
        params: { skip: nextSkip, limit: PAGE_SIZE, ...(name ? { name } : {}) },
      });
      const list = Array.isArray(data) ? data : [];
      if (reset) setOrgTemplates(list);
      else setOrgTemplates((prev) => [...prev, ...list]);
      setOSkip(nextSkip + list.length);
      setOHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      toast(e?.response?.data?.detail || e?.message || "Failed to load owned templates.", "error");
      setOHasMore(false);
    } finally {
      setLoadingOrg(false);
    }
  }

  function refreshAll(name = "") {
    setGSkip(0); setOSkip(0);
    loadGlobal({ reset: true, name });
    loadOrg({ reset: true, name });
  }

  useEffect(() => {
    refreshAll("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => refreshAll(search.trim()), 350);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleDownload(kind, templateId, assetType) {
    const key = `${templateId}:download:${assetType}`;
    setBusyKey(key, true);
    try {
      const base = kind === "global" ? `/templates/global/${templateId}` : `/templates/org/${templateId}`;
      const { data } = await api.get(`${base}/files/${assetType}`);
      const url = data?.url;
      if (!url) throw new Error("File not available.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast(e?.response?.data?.detail || e?.message || "Download failed.", "error");
    } finally {
      setBusyKey(key, false);
    }
  }

  async function handleUpload(templateId, assetType, file) {
    if (!file) return;
    const lower = (file.name || "").toLowerCase();
    if (assetType === "pdf" && !lower.endsWith(".pdf")) return toast("Please select a .pdf file.", "error");
    if (assetType === "illustrator" && !lower.endsWith(".ai")) return toast("Please select a .ai file.", "error");
    if (assetType === "image" && !(file.type || "").startsWith("image/")) return toast("Please select an image file.", "error");

    const key = `${templateId}:upload:${assetType}`;
    setBusyKey(key, true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data: updated } = await api.patch(`/templates/${templateId}/files/${assetType}`, form);
      setGlobalTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, ...updated } : t)));
      setOrgTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, ...updated } : t)));
      toast("File uploaded successfully!");
    } catch (e) {
      toast(e?.response?.data?.detail || e?.message || "Upload failed.", "error");
    } finally {
      setBusyKey(key, false);
    }
  }

  async function handleBuyGlobal(templateId) {
    if (isGuestUser) return toast("You must belong to an organization to buy templates.", "error");
    const key = `${templateId}:buy`;
    setBusyKey(key, true);
    try {
      const { data: cloned } = await api.post(`/templates/global/${templateId}/buy`);
      if (cloned?.id) {
        setOrgTemplates((prev) => {
          const exists = prev.some((x) => x.id === cloned.id);
          return exists
            ? prev.map((x) => (x.id === cloned.id ? cloned : x))
            : [cloned, ...prev];
        });
      }
      toast("Template added to your organization!");
    } catch (e) {
      toast(e?.response?.data?.detail || e?.message || "Failed to buy template.", "error");
    } finally {
      setBusyKey(key, false);
    }
  }

  const gSubtitle = useMemo(() => {
    if (loadingGlobal) return "Loading…";
    const base = `${globalTemplates.length} template${globalTemplates.length !== 1 ? "s" : ""}`;
    return isGuestUser
      ? `${base} — join an organization to buy.`
      : `${base} — buy any to clone it into your org.`;
  }, [loadingGlobal, globalTemplates.length, isGuestUser]);

  const oSubtitle = useMemo(() => {
    if (isGuestUser) return "Subscription or organization required.";
    if (loadingOrg) return "Loading…";
    return `${orgTemplates.length} template${orgTemplates.length !== 1 ? "s" : ""} owned by your organization.`;
  }, [isGuestUser, loadingOrg, orgTemplates.length]);

  return (
    <div className="tm-wrap">

      {/* Top bar */}
      <div className="tm-topbar">
        <div className="tm-topbar-left">
          <div className="tm-title">Template Manager</div>
          <div className="tm-subtitle">
            Browse global templates and manage your organization's owned templates.
            Click any thumbnail to preview full-size.
          </div>
        </div>

        <div className="tm-topbar-right">
          <div className="tm-search">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="tm-search-icon">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="tm-search-input"
            />
          </div>
          <button
            className="tm-btn tm-btn-ghost"
            type="button"
            onClick={() => refreshAll(search.trim())}
            title="Refresh"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Global templates */}
      <TemplateSection
        title={search.trim() ? "Global Templates (filtered)" : "Global Templates"}
        subtitle={gSubtitle}
        chipText={isSuperAdmin ? "Super Admin — upload enabled" : null}
        chipVariant="admin"
        loading={loadingGlobal}
        templates={globalTemplates}
        hasMore={gHasMore}
        onLoadMore={() => loadGlobal({ reset: false, name: search.trim() })}
        onDownload={handleDownload}
        onUpload={handleUpload}
        onBuy={handleBuyGlobal}
        canUpload={canUploadGlobal}
        canBuy={canBuy}
        kind="global"
        busyMap={busy}
        emptyTitle="No global templates found"
        emptySub="Try clearing the search or check your permissions."
        isGuest={false}
      />

      {/* Org templates */}
      <TemplateSection
        title={search.trim() ? "Owned Templates (filtered)" : "Owned Templates"}
        subtitle={oSubtitle}
        chipText={!isGuestUser ? "Uploads enabled" : null}
        loading={loadingOrg}
        templates={orgTemplates}
        hasMore={oHasMore}
        onLoadMore={() => loadOrg({ reset: false, name: search.trim() })}
        onDownload={handleDownload}
        onUpload={handleUpload}
        onBuy={handleBuyGlobal}
        canUpload={canUploadOrg}
        canBuy={false}
        kind="org"
        busyMap={busy}
        emptyTitle={isGuestUser ? "Organization Required" : "No owned templates yet"}
        emptySub={
          isGuestUser
            ? "Buy a subscription or accept an invitation to manage templates."
            : "Buy a global template to clone it into your organization."
        }
        isGuest={isGuestUser}
      />
    </div>
  );
}