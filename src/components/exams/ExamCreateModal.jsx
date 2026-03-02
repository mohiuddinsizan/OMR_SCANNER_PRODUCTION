// src/components/exams/ExamCreateModal.jsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../../lib/api";
import TemplatePickerModal from "./TemplatePickerModal";
import "../../styles/ExamCreateModal.css";

/* ─────────────────────────────────────────────────── */
/*  Constants & small helpers                           */
/* ─────────────────────────────────────────────────── */

const OPTION_LABELS = ["A", "B", "C", "D", "E"];

function toIsoLocal(dateStr, timeStr) {
  if (!dateStr) return null;
  const t = timeStr || "00:00";
  return new Date(`${dateStr}T${t}:00`).toISOString();
}

function safeInt(v, fallback = 1) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function makeSetLabels(n) {
  return Array.from({ length: Math.min(n, 26) }, (_, i) =>
    String.fromCharCode(65 + i)
  );
}

function emptyAK(setLabels) {
  return Object.fromEntries(setLabels.map((l) => [l, {}]));
}

function buildAK({ mode, gridState, serialState, setLabels, numQuestions }) {
  const result = {};
  const n = safeInt(numQuestions, 1);

  for (const sl of setLabels) {
    if (mode === "grid") {
      const raw = gridState[sl] || {};
      const filtered = {};
      for (const [k, v] of Object.entries(raw)) {
        if (Number(k) >= 1 && Number(k) <= n) filtered[k] = v;
      }
      result[sl] = filtered;
    } else {
      const s = (serialState[sl] || "")
        .toUpperCase()
        .replace(/[^A-E]/g, "")
        .slice(0, n);
      const map = {};
      for (let i = 0; i < s.length; i++) {
        if (s[i]) map[String(i + 1)] = s[i];
      }
      result[sl] = map;
    }
  }

  const anyFilled = Object.values(result).some(
    (m) => Object.keys(m).length > 0
  );
  return anyFilled ? result : null;
}

/* ─────────────────────────────────────────────────── */
/*  AnswerKeyBuilder — exposes getAK() via forwardRef   */
/* ─────────────────────────────────────────────────── */

const AnswerKeyBuilder = forwardRef(function AnswerKeyBuilder(
  { setLabels, disabled },
  ref
) {
  const [mode, setMode] = useState("grid");
  const [numQuestions, setNumQuestions] = useState(30);
  const [activeSet, setActiveSet] = useState(setLabels[0] || "A");
  const [gridState, setGridState] = useState(() => emptyAK(setLabels));
  const [serialState, setSerialState] = useState(() =>
    Object.fromEntries(setLabels.map((l) => [l, ""]))
  );

  /* Expose getAK() to parent */
  useImperativeHandle(
    ref,
    () => ({
      getAK: () =>
        buildAK({ mode, gridState, serialState, setLabels, numQuestions }),
    }),
    [mode, gridState, serialState, setLabels, numQuestions]
  );

  /* Sync state keys when setLabels changes (setCount changed) */
  useEffect(() => {
    setGridState((prev) => {
      const next = {};
      setLabels.forEach((l) => {
        next[l] = prev[l] || {};
      });
      return next;
    });
    setSerialState((prev) => {
      const next = {};
      setLabels.forEach((l) => {
        next[l] = prev[l] || "";
      });
      return next;
    });
    setActiveSet((prev) =>
      setLabels.includes(prev) ? prev : setLabels[0] || "A"
    );
  }, [setLabels]);

  /* Grid: toggle selection */
  function gridSelect(sl, qNum, opt) {
    setGridState((prev) => {
      const m = { ...(prev[sl] || {}) };
      if (m[String(qNum)] === opt) delete m[String(qNum)];
      else m[String(qNum)] = opt;
      return { ...prev, [sl]: m };
    });
  }

  function gridClear(sl, qNum) {
    setGridState((prev) => {
      const m = { ...(prev[sl] || {}) };
      delete m[String(qNum)];
      return { ...prev, [sl]: m };
    });
  }

  /* Serial: update string */
  function onSerialChange(sl, raw) {
    const clean = raw
      .toUpperCase()
      .replace(/[^A-E]/g, "")
      .slice(0, safeInt(numQuestions, 200));
    setSerialState((prev) => ({ ...prev, [sl]: clean }));
  }

  /* Progress for current set */
  const currentMap = useMemo(() => {
    if (mode === "grid") return gridState[activeSet] || {};
    const s = (serialState[activeSet] || "").toUpperCase();
    const m = {};
    for (let i = 0; i < s.length && i < numQuestions; i++) {
      if (s[i]) m[String(i + 1)] = s[i];
    }
    return m;
  }, [mode, gridState, serialState, activeSet, numQuestions]);

  const answeredCount = Object.keys(currentMap).length;
  const pct =
    numQuestions > 0 ? Math.round((answeredCount / numQuestions) * 100) : 0;

  /* Count filled answers per set (for tab badge) */
  function setFilledCount(sl) {
    if (mode === "grid") {
      return Object.keys(gridState[sl] || {}).length;
    }
    const s = (serialState[sl] || "")
      .toUpperCase()
      .replace(/[^A-E]/g, "");
    return Math.min(s.length, numQuestions);
  }

  return (
    <div className="ecm-section">
      {/* ── Header row ── */}
      <div className="ecm-ak-header">
        <div>
          <div className="ecm-ak-title">
            Answer Keys
            <span
              style={{ opacity: 0.4, fontWeight: 400, marginLeft: 7 }}
            >
              (optional)
            </span>
          </div>
          <div className="ecm-ak-sub">
            Fill in answers for each set, or leave blank and add them later.
          </div>
        </div>
        <div className="ecm-mode-toggle">
          <button
            type="button"
            className={`ecm-mode-btn${mode === "grid" ? " active" : ""}`}
            onClick={() => setMode("grid")}
            disabled={disabled}
          >
            ☰ Grid
          </button>
          <button
            type="button"
            className={`ecm-mode-btn${mode === "serial" ? " active" : ""}`}
            onClick={() => setMode("serial")}
            disabled={disabled}
          >
            ⌨ Quick Type
          </button>
        </div>
      </div>

      {/* ── Question count ── */}
      <div className="ecm-q-count-row">
        <span className="ecm-q-count-label">Questions per set:</span>
        <input
          type="number"
          min="1"
          max="200"
          value={numQuestions}
          onChange={(e) =>
            setNumQuestions(
              Math.min(200, Math.max(1, Number(e.target.value) || 1))
            )
          }
          className="ecm-q-count-input"
          disabled={disabled}
        />
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.25)",
            fontFamily: "Outfit, sans-serif",
          }}
        >
          max 200
        </span>
      </div>

      {/* ── Set tabs (only if multiple sets) ── */}
      {setLabels.length > 1 && (
        <div className="ecm-set-tabs">
          {setLabels.map((sl) => {
            const filled = setFilledCount(sl);
            return (
              <button
                key={sl}
                type="button"
                className={`ecm-set-tab${activeSet === sl ? " active" : ""}`}
                onClick={() => setActiveSet(sl)}
                disabled={disabled}
              >
                Set {sl}
                {filled > 0 && (
                  <span className="ecm-set-tab-count">{filled}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Progress ── */}
      <div className="ecm-serial-progress">
        <span>
          Set{" "}
          <b style={{ color: "rgba(255,255,255,0.8)" }}>{activeSet}</b>:{" "}
          {answeredCount}/{numQuestions}
        </span>
        <div className="ecm-serial-bar">
          <div
            className="ecm-serial-bar-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span>{pct}%</span>
      </div>

      {/* ══ SERIAL MODE ══ */}
      {mode === "serial" && (
        <div className="ecm-serial-wrap">
          <div className="ecm-serial-label">
            Type answers in order for{" "}
            <b style={{ color: "rgba(255,255,255,0.82)" }}>Set {activeSet}</b> —
            e.g.{" "}
            <code
              style={{
                fontFamily: "JetBrains Mono, monospace",
                opacity: 0.6,
                fontSize: "0.9em",
              }}
            >
              ABDC…
            </code>{" "}
            (A–E only, {numQuestions} characters max)
          </div>
          <input
            className="ecm-serial-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={safeInt(numQuestions, 200)}
            value={serialState[activeSet] || ""}
            onChange={(e) => onSerialChange(activeSet, e.target.value)}
            placeholder={`Enter up to ${numQuestions} answers, e.g. ABCDABCD…`}
            disabled={disabled}
          />
          <div className="ecm-input-hint">
            A = Option A, B = Option B, C = Option C, D = Option D, E =
            Option E. Invalid characters are ignored.
          </div>
        </div>
      )}

      {/* ══ GRID MODE ══ */}
      {mode === "grid" && (
        <>
          <div className="ecm-grid-mode">
            {Array.from({ length: numQuestions }, (_, i) => {
              const qNum = i + 1;
              const selected = (gridState[activeSet] || {})[String(qNum)];
              return (
                <div key={qNum} className="ecm-q-row">
                  <span className="ecm-q-num">Q{qNum}</span>
                  <div className="ecm-q-options">
                    {OPTION_LABELS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`ecm-q-opt${
                          selected === opt ? ` selected-${opt}` : ""
                        }`}
                        onClick={() => gridSelect(activeSet, qNum, opt)}
                        disabled={disabled}
                        title={`Q${qNum}: Option ${opt}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  {selected && (
                    <button
                      type="button"
                      className="ecm-q-clear"
                      onClick={() => gridClear(activeSet, qNum)}
                      disabled={disabled}
                      title="Clear answer"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Distribution legend */}
          <div className="ecm-grid-stats">
            {(() => {
              const colors = [
                "rgba(59,130,246,0.7)",
                "rgba(16,185,129,0.7)",
                "rgba(245,158,11,0.7)",
                "rgba(139,92,246,0.7)",
                "rgba(236,72,153,0.7)",
              ];
              const setMap = gridState[activeSet] || {};
              const anyFilled = Object.keys(setMap).length > 0;
              if (!anyFilled)
                return (
                  <span style={{ opacity: 0.35 }}>
                    No answers selected for Set {activeSet}
                  </span>
                );
              return OPTION_LABELS.map((opt, idx) => {
                const cnt = Object.values(setMap).filter(
                  (v) => v === opt
                ).length;
                if (cnt === 0) return null;
                return (
                  <span key={opt}>
                    <span
                      className="ecm-grid-stat-dot"
                      style={{ background: colors[idx] }}
                    />
                    {opt}: {cnt}
                  </span>
                );
              });
            })()}
          </div>
        </>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────────── */
/*  ExamCreateModal                                     */
/* ─────────────────────────────────────────────────── */

export default function ExamCreateModal({
  isOpen,
  onClose,
  courseId,
  onCreated,
  showToast,
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [visible, setVisible] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [setCount, setSetCount] = useState(1);
  const [template, setTemplate] = useState(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // forwardRef to AnswerKeyBuilder
  const akRef = useRef(null);

  const setLabels = useMemo(
    () => makeSetLabels(safeInt(setCount, 1)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safeInt(setCount, 1)]
  );

  function toast(msg, type = "success") {
    if (typeof showToast === "function") showToast(msg, type);
    else console.log(type.toUpperCase() + ":", msg);
  }

  function reset() {
    setSaving(false);
    setName("");
    setBatchName("");
    setVisible(true);
    setDate("");
    setTime("");
    setSetCount(1);
    setTemplate(null);
  }

  function close() {
    reset();
    onClose?.();
  }

  async function onSubmit(e) {
    e?.preventDefault();
    if (!courseId) return toast("Course ID missing.", "error");
    const n = String(name || "").trim();
    if (!n) return toast("Exam name is required.", "error");
    if (!template?.id)
      return toast("Please select an organization template.", "error");

    // Read AK from builder imperatively
    const answerKey = akRef.current?.getAK() ?? null;

    const payload = {
      course_id: courseId,
      name: n,
      batch_name: String(batchName || "").trim() || null,
      is_visible: !!visible,
      template_id: template.id,
      set_count: safeInt(setCount, 1),
      exam_at: toIsoLocal(date, time),
      answer_key: answerKey,
    };

    setSaving(true);
    try {
      const { data } = await api.post("/exams/", payload);
      onCreated?.(data);
      toast("Exam created successfully!");
      close();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to create exam.";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <TemplatePickerModal
        isOpen={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onPick={(t) => setTemplate(t)}
        showToast={showToast}
      />

      <div
        className="ecm-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div
          className="ecm-modal"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="ecm-header">
            <div className="ecm-header-left">
              <h3>Create Exam</h3>
              <p>
                Fill exam details, choose a template, and optionally add answer
                keys for{" "}
                <b>
                  {setLabels.length} set{setLabels.length !== 1 ? "s" : ""}
                </b>{" "}
                ({setLabels.join(", ")}).
              </p>
            </div>
            <button
              type="button"
              className="ecm-close-btn"
              onClick={close}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* ── Scrollable Body ── */}
          <div className="ecm-body">

            {/* Section: Details */}
            <div className="ecm-section">
              <div className="ecm-section-label">Exam Details</div>

              <div className="ecm-grid">
                <div className="ecm-field">
                  <label className="ecm-field-label">Exam Name *</label>
                  <input
                    className="ecm-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Midterm 2025"
                    disabled={saving}
                    autoFocus
                  />
                </div>

                <div className="ecm-field">
                  <label className="ecm-field-label">
                    Batch Name{" "}
                    <span style={{ opacity: 0.4, fontWeight: 400 }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    className="ecm-input"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. Morning Batch"
                    disabled={saving}
                  />
                </div>

                <div className="ecm-field">
                  <label className="ecm-field-label">Exam Date</label>
                  <input
                    className="ecm-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="ecm-field">
                  <label className="ecm-field-label">Exam Time</label>
                  <input
                    className="ecm-input"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="ecm-grid-3" style={{ marginTop: 4 }}>
                <div className="ecm-field">
                  <label className="ecm-field-label">Sets</label>
                  <input
                    className="ecm-input"
                    type="number"
                    min="1"
                    max="26"
                    value={setCount}
                    onChange={(e) => setSetCount(e.target.value)}
                    disabled={saving}
                  />
                  <div className="ecm-input-hint">
                    Labels:{" "}
                    <b style={{ color: "rgba(255,255,255,0.75)" }}>
                      {setLabels.join("  ")}
                    </b>
                  </div>
                </div>

                <div className="ecm-field">
                  <label className="ecm-field-label">Visibility</label>
                  <select
                    className="ecm-input"
                    value={visible ? "yes" : "no"}
                    onChange={(e) => setVisible(e.target.value === "yes")}
                    disabled={saving}
                  >
                    <option value="yes">Visible to users</option>
                    <option value="no">Hidden</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="ecm-divider" />

            {/* Section: Template */}
            <div className="ecm-section">
              <div className="ecm-section-label">Template</div>

              <div className="ecm-template-row">
                <div className="ecm-template-info">
                  <div className="ecm-template-info-title">
                    Organization Template *
                  </div>
                  <div className="ecm-template-info-sub">
                    Must be owned by your organization.
                  </div>
                </div>
                <button
                  type="button"
                  className={`ecm-btn ${
                    template?.id ? "ecm-btn-ghost" : "ecm-btn-select"
                  }`}
                  onClick={() => setTemplatePickerOpen(true)}
                  disabled={saving}
                >
                  {template?.id ? "Change Template" : "Select Template →"}
                </button>
              </div>

              {template?.id ? (
                <div className="ecm-template-selected">
                  <div className="ecm-template-selected-top">
                    <span className="ecm-template-name">
                      {template.name || "Template"}
                    </span>
                    <span className="ecm-template-tag">Selected ✓</span>
                  </div>
                  {template.preview_image_url && (
                    <img
                      src={template.preview_image_url}
                      alt={template.name}
                      loading="lazy"
                      className="ecm-template-preview-img"
                    />
                  )}
                  <div className="ecm-template-meta">
                    <span>
                      Version: <b>{template.version || "—"}</b>
                    </span>
                    <span>
                      ID: <b>{String(template.id).slice(0, 8)}…</b>
                    </span>
                  </div>
                  {template.description && (
                    <div className="ecm-template-desc">
                      {template.description}
                    </div>
                  )}
                </div>
              ) : (
                <div className="ecm-template-none">
                  No template selected — required to create an exam.
                </div>
              )}
            </div>

            <hr className="ecm-divider" />

            {/* Section: Answer Keys */}
            <AnswerKeyBuilder
              ref={akRef}
              setLabels={setLabels}
              disabled={saving}
            />
          </div>

          {/* ── Footer ── */}
          <div className="ecm-footer">
            <button
              type="button"
              className="ecm-btn ecm-btn-ghost"
              onClick={close}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ecm-btn ecm-btn-primary"
              onClick={onSubmit}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span
                    style={{
                      width: 13,
                      height: 13,
                      border: "2.5px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "ecmSpin 0.75s linear infinite",
                    }}
                  />
                  Creating…
                </>
              ) : (
                "Create Exam"
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes ecmSpin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}