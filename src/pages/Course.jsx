import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/Course.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("access_token");
}

async function apiFetch(path, { method = "GET", body, params } = {}) {
  const token = getToken();

  const url = new URL(API_BASE + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;

    if (data && typeof data === "object") {
      if (typeof data.detail === "string") msg = data.detail;
      else if (Array.isArray(data.detail)) msg = data.detail.map((d) => d?.msg || JSON.stringify(d)).join(", ");
      else if (typeof data.message === "string") msg = data.message;
      else msg = JSON.stringify(data);
    } else if (typeof data === "string" && data.trim()) {
      msg = data;
    }

    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ---------- Toast ----------
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`course-toast course-toast-${type}`}>
      <span className="course-toast-message">{message}</span>
      <button className="course-toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}

// ---------- Confirm Modal ----------
function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}) {
  if (!isOpen) return null;
  return (
    <div className="course-modal-backdrop" onMouseDown={onCancel}>
      <div className="course-confirm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="course-confirm-title">{title}</h3>
        <p className="course-confirm-message">{message}</p>
        <div className="course-confirm-actions">
          <button className="course-btn course-btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`course-btn ${danger ? "course-btn-danger" : "course-btn-primary"}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const emptyStudent = {
  roll: "",
  registration: "",
  phone: "",
  guardian_phone: "",
  batch_name: "",
  extra_details: {},
};

export default function Course() {
  const { courseId } = useParams();

  // UI
  const [activeTab, setActiveTab] = useState("exams"); // exams | students | leaderboard
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  // Course
  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);

  // Exams (dummy data for now)
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  // Students
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [filters, setFilters] = useState({ roll: "", batch_name: "" });

  // Student create/edit
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyStudent);

  const [editingId, setEditingId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Bulk (dummy)
  const [bulkFile, setBulkFile] = useState(null);

  function showToast(message, type = "success") {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, message, type }]);
  }

  function removeToast(id) {
    setToasts((p) => p.filter((t) => t.id !== id));
  }

  function showConfirm({ title, message, confirmText, cancelText, danger = false }) {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        danger,
        onConfirm: () => {
          setConfirmModal({ isOpen: false });
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal({ isOpen: false });
          resolve(false);
        },
      });
    });
  }

  // ---------------- LOADERS ----------------
  async function loadCourse() {
    setLoadingCourse(true);
    try {
      const data = await apiFetch(`/courses/${courseId}`);
      setCourse(data);
    } catch {
      setCourse(null);
    } finally {
      setLoadingCourse(false);
    }
  }

  async function loadExams() {
    setLoadingExams(true);
    try {
      // TODO: Replace with real backend endpoint later
      setExams([
        { id: "d1", name: "Midterm 1", exam_at: "2026-02-01", is_locked: false, batch_name: "Batch A" },
        { id: "d2", name: "Model Test", exam_at: "2026-02-05", is_locked: true, batch_name: "Batch B" },
        { id: "d3", name: "Final", exam_at: "2026-02-10", is_locked: false, batch_name: "" },
      ]);
    } catch {
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  }

  async function loadStudents() {
    setLoadingStudents(true);
    try {
      const data = await apiFetch(`/students/course/${courseId}`, {
        params: {
          skip: 0,
          limit: 1000,
          roll: filters.roll || undefined,
          batch_name: filters.batch_name || undefined,
        },
      });
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      setStudents([]);
      showToast(e.message || "Failed to load students.", "error");
    } finally {
      setLoadingStudents(false);
    }
  }

  useEffect(() => {
    document.title = "Course — Scanova";
    if (!courseId) return;
    loadCourse();
    loadExams();
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // reload students when filters change (debounce-lite)
  useEffect(() => {
    if (!courseId) return;
    const t = setTimeout(() => loadStudents(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.roll, filters.batch_name, courseId]);

  // ---------------- STUDENT CRUD ----------------
  function openCreateStudent() {
    setCreateForm({ ...emptyStudent });
    setCreateOpen(true);
  }

  function closeCreateStudent() {
    setCreateOpen(false);
    setCreating(false);
  }

  async function onCreateStudent(e) {
    e.preventDefault();
    setCreating(true);

    try {
      const roll = String(createForm.roll || "").trim();
      if (!roll) {
        showToast("Roll is required.", "error");
        return;
      }

      const payload = {
        course_id: courseId,
        roll,
        registration: String(createForm.registration || "").trim() || null,
        phone: String(createForm.phone || "").trim() || null,
        guardian_phone: String(createForm.guardian_phone || "").trim() || null,
        batch_name: String(createForm.batch_name || "").trim() || null,
        extra_details: createForm.extra_details || {},
      };

      const created = await apiFetch("/students/", { method: "POST", body: payload });
      setStudents((p) => [created, ...p]);
      showToast("Student added.");
      closeCreateStudent();
    } catch (e2) {
      showToast(e2.message || "Failed to add student.", "error");
    } finally {
      setCreating(false);
    }
  }

  function startEditStudent(s) {
    setEditingId(s.id);
    setEditForm({
      roll: s.roll ?? "",
      registration: s.registration ?? "",
      phone: s.phone ?? "",
      guardian_phone: s.guardian_phone ?? "",
      batch_name: s.batch_name ?? "",
      extra_details: s.extra_details ?? {},
    });
  }

  function cancelEditStudent() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEditStudent(studentId) {
    setSavingEdit(true);
    try {
      const payload = {
        roll: String(editForm.roll || "").trim() || undefined,
        registration: String(editForm.registration || "").trim() || undefined,
        phone: String(editForm.phone || "").trim() || undefined,
        guardian_phone: String(editForm.guardian_phone || "").trim() || undefined,
        batch_name: String(editForm.batch_name || "").trim() || undefined,
        extra_details: editForm.extra_details ?? undefined,
      };

      if (!payload.roll) {
        showToast("Roll is required.", "error");
        return;
      }

      const updated = await apiFetch(`/students/${studentId}`, { method: "PATCH", body: payload });
      setStudents((p) => p.map((x) => (x.id === studentId ? updated : x)));
      setEditingId(null);
      setEditForm({});
      showToast("Student updated.");
    } catch (e) {
      showToast(e.message || "Failed to update student.", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteStudent(studentId) {
    const ok = await showConfirm({
      title: "Delete Student",
      message: "Are you sure you want to delete this student? This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
    });
    if (!ok) return;

    try {
      await apiFetch(`/students/${studentId}`, { method: "DELETE" });
      setStudents((p) => p.filter((x) => x.id !== studentId));
      showToast("Student deleted.");
    } catch (e) {
      showToast(e.message || "Failed to delete student.", "error");
    }
  }

  // ---------------- EXAMS ACTIONS (IMPLEMENT LATER) ----------------
  function addExamDummy() {
    showToast("Add Exam will be implemented later.", "error");
  }

  function openExamDummy(examId) {
    showToast(`Open exam (${examId}) — coming soon.`, "error");
  }

  function editExamDummy(examId) {
    showToast(`Edit exam (${examId}) — coming soon.`, "error");
  }

  async function deleteExamDummy(examId) {
    const ok = await showConfirm({
      title: "Delete Exam",
      message: "Delete exam feature will be implemented later. Continue?",
      confirmText: "Ok",
      cancelText: "Cancel",
      danger: true,
    });
    if (!ok) return;
    showToast(`Delete exam (${examId}) — coming soon.`, "error");
  }

  const sortedExams = useMemo(() => {
    const arr = Array.isArray(exams) ? [...exams] : [];
    arr.sort((a, b) => new Date(b.exam_at || 0) - new Date(a.exam_at || 0));
    return arr;
  }, [exams]);

  const effectiveCourseName = course?.name || "Course";
  const effectiveCourseSubtitle = course?.description || `Course ID: ${courseId}`;

  // ---------- Bulk Upload (dummy) ----------
  function bulkUploadDummy() {
    if (!bulkFile) {
      showToast("Please select an Excel file first.", "error");
      return;
    }
    showToast("Excel bulk upload will be implemented later.", "error");
  }

  function clearBulkFile() {
    setBulkFile(null);
  }

  return (
    <div className="course-page">
      {/* Toasts */}
      <div className="course-toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Confirm */}
      <ConfirmModal {...confirmModal} />

      <div className="container course-container">
        {/* HERO */}
        <div className="course-hero">
          <div className="course-hero-top">
            <div>
              <div className="course-badge">Course Dashboard</div>
              <h1 className="course-title">
                {loadingCourse ? "Loading..." : effectiveCourseName}
                <span className="course-gradient">.</span>
              </h1>
              <p className="course-subtitle">{loadingCourse ? "Fetching course info..." : effectiveCourseSubtitle}</p>
            </div>

            <div className="course-hero-actions">
              <button className="course-btn course-btn-ghost" type="button" onClick={() => (window.location.href = "/organization")}>
                ← Back to Organization
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="course-tabs">
            <button className={`course-tab ${activeTab === "exams" ? "active" : ""}`} type="button" onClick={() => setActiveTab("exams")}>
              Exams
            </button>
            <button
              className={`course-tab ${activeTab === "students" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("students")}
            >
              Students
              <span className="course-tab-badge">{loadingStudents ? "—" : students.length}</span>
            </button>
            <button
              className={`course-tab ${activeTab === "leaderboard" ? "active" : ""}`}
              type="button"
              onClick={() => setActiveTab("leaderboard")}
            >
              Leaderboard
            </button>
          </div>
        </div>

        {/* EXAMS TAB */}
        {activeTab === "exams" && (
          <div className="course-section">
            <div className="course-section-header">
              <div>
                <h2 className="course-section-title">All Exams</h2>
                <p className="course-section-subtitle">
                  {loadingExams ? "Loading exams..." : `${sortedExams.length} exam(s) in this course`}
                </p>
              </div>

              <div className="course-inline-actions">
                <button className="course-btn course-btn-primary" type="button" onClick={addExamDummy}>
                  + Add New Exam
                </button>
                <button className="course-btn course-btn-ghost" type="button" onClick={loadExams} disabled={loadingExams}>
                  Refresh
                </button>
              </div>
            </div>

            {loadingExams ? (
              <div className="course-loading">
                <div className="course-spinner" />
                <p>Loading exams...</p>
              </div>
            ) : sortedExams.length === 0 ? (
              <div className="course-empty">
                <h3>No exams yet</h3>
                <p>Click “Add New Exam” to create your first exam.</p>
              </div>
            ) : (
              <div className="course-exams-grid">
                {sortedExams.map((ex, idx) => {
                  const colorIndex = idx % 6;
                  return (
                    <div key={ex.id} className={`course-exam-card course-color-${colorIndex}`}>
                      <div className="course-exam-top">
                        <div className="course-exam-title">{ex.name || "Untitled Exam"}</div>
                        {ex.is_locked ? (
                          <span className="course-pill course-pill-locked">LOCKED</span>
                        ) : (
                          <span className="course-pill">ACTIVE</span>
                        )}
                      </div>

                      <div className="course-exam-meta">
                        <div className="course-exam-row">
                          <span className="course-label">Exam Date</span>
                          <span className="course-value">{ex.exam_at ? new Date(ex.exam_at).toLocaleString() : "—"}</span>
                        </div>
                        <div className="course-exam-row">
                          <span className="course-label">Batch</span>
                          <span className="course-value">{ex.batch_name || "—"}</span>
                        </div>
                      </div>

                      <div className="course-exam-actions">
                        <button className="course-btn course-btn-primary course-btn-sm" type="button" onClick={() => openExamDummy(ex.id)}>
                          Open
                        </button>
                        <button className="course-btn course-btn-secondary course-btn-sm" type="button" onClick={() => editExamDummy(ex.id)}>
                          Edit
                        </button>
                        <button className="course-btn course-btn-danger course-btn-sm" type="button" onClick={() => deleteExamDummy(ex.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === "students" && (
          <div className="course-section">
            <div className="course-section-header">
              <div>
                <h2 className="course-section-title">Students</h2>
                <p className="course-section-subtitle">
                  Manage your student list for this course. Required: <b>Roll</b>. Others are optional.
                </p>
              </div>

              <div className="course-inline-actions">
                <button className="course-btn course-btn-primary" type="button" onClick={openCreateStudent}>
                  + Add Student
                </button>
                <button className="course-btn course-btn-ghost" type="button" onClick={loadStudents} disabled={loadingStudents}>
                  Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="course-filters">
              <div className="course-filter">
                <label className="course-filter-label">Search by Roll</label>
                <input
                  className="course-input"
                  value={filters.roll}
                  onChange={(e) => setFilters((p) => ({ ...p, roll: e.target.value }))}
                  placeholder="e.g. 101"
                />
              </div>
              <div className="course-filter">
                <label className="course-filter-label">Filter by Batch</label>
                <input
                  className="course-input"
                  value={filters.batch_name}
                  onChange={(e) => setFilters((p) => ({ ...p, batch_name: e.target.value }))}
                  placeholder="e.g. HSC 2024 Evening"
                />
              </div>
              <button className="course-btn course-btn-secondary" type="button" onClick={() => setFilters({ roll: "", batch_name: "" })}>
                Clear
              </button>
            </div>

            {/* Bulk upload (dummy UI) - FIXED FILE INPUT UI */}
            <div className="course-bulk-card">
              <div>
                <h3 className="course-bulk-title">Bulk Add Students (Excel)</h3>
                <p className="course-bulk-sub">
                  Upload an Excel file to add many students at once. <b>Required column:</b> roll. Optional: registration, phone,
                  guardian_phone, batch_name.
                </p>
              </div>

              <div className="course-bulk-actions">
                <input
                  id="bulkExcel"
                  className="course-file-hidden"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                />

                <label htmlFor="bulkExcel" className="course-file-pill" role="button" tabIndex={0}>
                  <span className="course-file-icon">📄</span>
                  <span className="course-file-text">{bulkFile ? "Change Excel" : "Choose Excel File"}</span>
                </label>

                <div className="course-file-name" title={bulkFile?.name || ""}>
                  {bulkFile ? bulkFile.name : "No file selected"}
                </div>

                {bulkFile ? (
                  <button className="course-btn course-btn-ghost" type="button" onClick={clearBulkFile}>
                    Remove
                  </button>
                ) : null}

                <button className="course-btn course-btn-primary" type="button" onClick={bulkUploadDummy}>
                  Upload (Soon)
                </button>
              </div>
            </div>

            {loadingStudents ? (
              <div className="course-loading">
                <div className="course-spinner" />
                <p>Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="course-empty">
                <h3>No students found</h3>
                <p>Add a student or upload an Excel file to get started.</p>
              </div>
            ) : (
              <div className="course-students-list">
                {students.map((s) => {
                  const editing = editingId === s.id;
                  return (
                    <div key={s.id} className="course-student-row">
                      {!editing ? (
                        <>
                          <div className="course-student-main">
                            <div className="course-student-title">
                              Roll: <b>{s.roll}</b>
                              {s.batch_name ? <span className="course-pill">{s.batch_name}</span> : null}
                            </div>
                            <div className="course-student-sub">
                              {s.registration ? `Reg: ${s.registration}` : "Reg: —"}
                              {" • "}
                              {s.phone ? `Phone: ${s.phone}` : "Phone: —"}
                              {" • "}
                              {s.guardian_phone ? `Guardian: ${s.guardian_phone}` : "Guardian: —"}
                            </div>
                          </div>

                          <div className="course-student-actions">
                            <button className="course-btn course-btn-secondary course-btn-sm" type="button" onClick={() => startEditStudent(s)}>
                              Edit
                            </button>
                            <button className="course-btn course-btn-danger course-btn-sm" type="button" onClick={() => deleteStudent(s.id)}>
                              Delete
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="course-student-edit">
                          <div className="course-edit-grid">
                            <div>
                              <label className="course-label">Roll *</label>
                              <input className="course-input" value={editForm.roll ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, roll: e.target.value }))} />
                            </div>
                            <div>
                              <label className="course-label">Registration</label>
                              <input
                                className="course-input"
                                value={editForm.registration ?? ""}
                                onChange={(e) => setEditForm((p) => ({ ...p, registration: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="course-label">Phone</label>
                              <input className="course-input" value={editForm.phone ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
                            </div>
                            <div>
                              <label className="course-label">Guardian Phone</label>
                              <input
                                className="course-input"
                                value={editForm.guardian_phone ?? ""}
                                onChange={(e) => setEditForm((p) => ({ ...p, guardian_phone: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="course-label">Batch Name</label>
                              <input
                                className="course-input"
                                value={editForm.batch_name ?? ""}
                                onChange={(e) => setEditForm((p) => ({ ...p, batch_name: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="course-student-actions" style={{ marginTop: 12 }}>
                            <button
                              className="course-btn course-btn-primary course-btn-sm"
                              type="button"
                              disabled={savingEdit}
                              onClick={() => saveEditStudent(s.id)}
                            >
                              {savingEdit ? "Saving..." : "Save"}
                            </button>
                            <button className="course-btn course-btn-ghost course-btn-sm" type="button" onClick={cancelEditStudent}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create Student Modal */}
            {createOpen && (
              <div className="course-modal-backdrop" onMouseDown={closeCreateStudent}>
                <div className="course-modal" onMouseDown={(e) => e.stopPropagation()}>
                  <div className="course-modal-header">
                    <div>
                      <h3 className="course-modal-title">Add Student</h3>
                      <p className="course-modal-subtitle">
                        Required: <b>Roll</b>. Everything else is optional.
                      </p>
                    </div>
                    <button className="course-modal-close" type="button" onClick={closeCreateStudent}>
                      ×
                    </button>
                  </div>

                  <form className="course-modal-body" onSubmit={onCreateStudent}>
                    <div className="course-edit-grid">
                      <div>
                        <label className="course-label">Roll *</label>
                        <input className="course-input" value={createForm.roll} onChange={(e) => setCreateForm((p) => ({ ...p, roll: e.target.value }))} disabled={creating} autoFocus />
                      </div>
                      <div>
                        <label className="course-label">Registration</label>
                        <input className="course-input" value={createForm.registration} onChange={(e) => setCreateForm((p) => ({ ...p, registration: e.target.value }))} disabled={creating} />
                      </div>
                      <div>
                        <label className="course-label">Phone</label>
                        <input className="course-input" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} disabled={creating} />
                      </div>
                      <div>
                        <label className="course-label">Guardian Phone</label>
                        <input className="course-input" value={createForm.guardian_phone} onChange={(e) => setCreateForm((p) => ({ ...p, guardian_phone: e.target.value }))} disabled={creating} />
                      </div>
                      <div>
                        <label className="course-label">Batch Name</label>
                        <input className="course-input" value={createForm.batch_name} onChange={(e) => setCreateForm((p) => ({ ...p, batch_name: e.target.value }))} disabled={creating} />
                      </div>
                    </div>

                    <div className="course-modal-footer">
                      <button className="course-btn course-btn-ghost" type="button" onClick={closeCreateStudent} disabled={creating}>
                        Cancel
                      </button>
                      <button className="course-btn course-btn-primary" type="submit" disabled={creating}>
                        {creating ? "Adding..." : "Add Student"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD TAB (IMPLEMENT LATER) */}
        {activeTab === "leaderboard" && (
          <div className="course-section">
            <div className="course-section-header">
              <div>
                <h2 className="course-section-title">Leaderboard</h2>
                <p className="course-section-subtitle">
                  Combined results of all exams in this course (coming soon).
                </p>
              </div>
              <div className="course-inline-actions">
                <button className="course-btn course-btn-ghost" type="button" onClick={() => showToast("Leaderboard will be implemented later.", "error")}>
                  Refresh
                </button>
              </div>
            </div>

            <div className="course-empty">
              <h3>Not implemented yet</h3>
              <p>
                When you give exam + scan evaluation endpoints, we will show: Total marks, average, rank, and batch filters here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
