// src/components/exams/ExamEditModal.jsx
import { useEffect, useState } from "react";
import api from "../../lib/api";

function toDateTimeInputs(examAt) {
  if (!examAt) return { date: "", time: "" };
  try {
    const d = new Date(examAt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
  } catch {
    return { date: "", time: "" };
  }
}

function toIsoLocal(dateStr, timeStr) {
  if (!dateStr) return null;
  const t = timeStr || "00:00";
  return new Date(`${dateStr}T${t}:00`).toISOString();
}

export default function ExamEditModal({
  isOpen,
  onClose,
  exam,
  onUpdated,
  onDeleted,
  showToast,
  showConfirm,
}) {
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(""); // "pdf" | "ai" | "lock" | "unlock" | "visibility" | "delete"

  const [name, setName] = useState("");
  const [batchName, setBatchName] = useState("");
  const [visible, setVisible] = useState(true);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [answerKeyText, setAnswerKeyText] = useState("");

  const isLocked = !!exam?.is_locked;

  function toast(msg, type = "success") {
    if (typeof showToast === "function") showToast(msg, type);
    else console.log(type.toUpperCase() + ":", msg);
  }

  useEffect(() => {
    if (!isOpen || !exam) return;
    setName(exam.name || "");
    setBatchName(exam.batch_name || "");
    setVisible(exam.is_visible !== false);

    const dt = toDateTimeInputs(exam.exam_at);
    setDate(dt.date);
    setTime(dt.time);

    setAnswerKeyText(exam.answer_key ? JSON.stringify(exam.answer_key, null, 2) : "");
  }, [isOpen, exam]);

  async function downloadSnapshot(assetType) {
    if (!exam?.id) return;
    setBusy(assetType);

    try {
      const path =
        assetType === "pdf"
          ? `/exams/${exam.id}/template-files/pdf`
          : `/exams/${exam.id}/template-files/illustrator`;

      const { data } = await api.get(path);
      const url = data?.url;
      if (!url) throw new Error("File not available.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Download failed.";
      toast(msg, "error");
    } finally {
      setBusy("");
    }
  }

  async function saveChanges() {
    if (!exam?.id) return;
    if (isLocked) return toast("Exam is locked. Unlock it to edit.", "error");

    const payload = {
      name: String(name || "").trim() || undefined,
      batch_name: String(batchName || "").trim() || null,
      exam_at: toIsoLocal(date, time),
      is_visible: !!visible,
      answer_key: null,
    };

    const akRaw = String(answerKeyText || "").trim();
    if (akRaw) {
      try {
        payload.answer_key = JSON.parse(akRaw);
      } catch (e) {
        return toast(e?.message || "Invalid answer key JSON.", "error");
      }
    }

    setSaving(true);
    try {
      const { data } = await api.patch(`/exams/${exam.id}`, payload);
      toast("Exam updated.");
      onUpdated?.(data);
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to update exam.";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleLock(nextLocked) {
    if (!exam?.id) return;
    setBusy(nextLocked ? "lock" : "unlock");
    try {
      const { data } = await api.post(`/exams/${exam.id}/${nextLocked ? "lock" : "unlock"}`);
      toast(nextLocked ? "Exam locked." : "Exam unlocked.");
      onUpdated?.(data);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to update lock.";
      toast(msg, "error");
    } finally {
      setBusy("");
    }
  }

  async function toggleVisibility(nextVisible) {
    if (!exam?.id) return;
    setBusy("visibility");
    try {
      const { data } = await api.patch(`/exams/${exam.id}/visibility`, { is_visible: !!nextVisible });
      toast(nextVisible ? "Exam is now visible." : "Exam hidden.");
      onUpdated?.(data);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to update visibility.";
      toast(msg, "error");
    } finally {
      setBusy("");
    }
  }

  async function deleteExam() {
    if (!exam?.id) return;
    if (isLocked) return toast("Cannot delete locked exam.", "error");

    let ok = true;
    if (typeof showConfirm === "function") {
      ok = await showConfirm({
        title: "Delete Exam",
        message: "Are you sure you want to delete this exam? This cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        danger: true,
      });
    }
    if (!ok) return;

    setBusy("delete");
    try {
      await api.delete(`/exams/${exam.id}`);
      toast("Exam deleted.");
      onDeleted?.(exam.id);
      onClose?.();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to delete exam.";
      toast(msg, "error");
    } finally {
      setBusy("");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="course-modal-backdrop" onMouseDown={onClose}>
      <div className="course-modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 980 }}>
        <div className="course-modal-header">
          <div>
            <h3 className="course-modal-title">Edit Exam</h3>
            <p className="course-modal-subtitle">Download template snapshot PDF/AI, update answer keys, lock/unlock.</p>
          </div>
          <button className="course-modal-close" type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="course-modal-body">
          <div className="course-inline-actions" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <div className="course-inline-actions">
              <button className="course-btn course-btn-secondary" type="button" onClick={() => downloadSnapshot("pdf")} disabled={busy === "pdf"}>
                {busy === "pdf" ? "Loading..." : "Download PDF"}
              </button>
              <button className="course-btn course-btn-secondary" type="button" onClick={() => downloadSnapshot("ai")} disabled={busy === "ai"}>
                {busy === "ai" ? "Loading..." : "Download AI"}
              </button>
            </div>

            <div className="course-inline-actions">
              <button
                className={`course-btn ${exam?.is_visible ? "course-btn-ghost" : "course-btn-primary"}`}
                type="button"
                onClick={() => toggleVisibility(!exam?.is_visible)}
                disabled={busy === "visibility"}
              >
                {busy === "visibility" ? "Saving..." : exam?.is_visible ? "Make Hidden" : "Make Visible"}
              </button>

              <button
                className={`course-btn ${isLocked ? "course-btn-ghost" : "course-btn-danger"}`}
                type="button"
                onClick={() => toggleLock(!isLocked)}
                disabled={busy === "lock" || busy === "unlock"}
              >
                {busy === "lock" || busy === "unlock" ? "Updating..." : isLocked ? "Unlock" : "Lock"}
              </button>
            </div>
          </div>

          <div className="course-edit-grid">
            <div>
              <label className="course-label">Exam Name</label>
              <input className="course-input" value={name} onChange={(e) => setName(e.target.value)} disabled={saving || isLocked} />
            </div>

            <div>
              <label className="course-label">Batch Name</label>
              <input className="course-input" value={batchName} onChange={(e) => setBatchName(e.target.value)} disabled={saving || isLocked} />
            </div>

            <div>
              <label className="course-label">Exam Date</label>
              <input className="course-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={saving || isLocked} />
            </div>

            <div>
              <label className="course-label">Exam Time</label>
              <input className="course-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={saving || isLocked} />
            </div>

            <div>
              <label className="course-label">Visibility</label>
              <select className="course-input" value={visible ? "yes" : "no"} onChange={(e) => setVisible(e.target.value === "yes")} disabled={saving || isLocked}>
                <option value="yes">Visible</option>
                <option value="no">Hidden</option>
              </select>
            </div>

            <div>
              <label className="course-label">Locked</label>
              <input className="course-input" value={isLocked ? "Yes" : "No"} disabled />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="course-section-header" style={{ marginBottom: 10 }}>
              <div>
                <h2 className="course-section-title" style={{ fontSize: 16 }}>Answer Keys (JSON)</h2>
                <p className="course-section-subtitle">Edit the full answer_key JSON here.</p>
              </div>
            </div>

            <textarea
              className="course-input"
              style={{ minHeight: 220, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
              value={answerKeyText}
              onChange={(e) => setAnswerKeyText(e.target.value)}
              disabled={saving || isLocked}
              placeholder='Example: { "A": {"1":"B"}, "B": {"1":"C"} }'
            />
          </div>
        </div>

        <div className="course-modal-footer">
          <button className="course-btn course-btn-danger" type="button" onClick={deleteExam} disabled={busy === "delete" || isLocked}>
            {busy === "delete" ? "Deleting..." : "Delete"}
          </button>

          <div style={{ flex: 1 }} />

          <button className="course-btn course-btn-ghost" type="button" onClick={onClose} disabled={saving}>
            Close
          </button>
          <button className="course-btn course-btn-primary" type="button" onClick={saveChanges} disabled={saving || isLocked}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}