// src/components/exams/ExamsSection.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import ExamCreateModal from "./ExamCreateModal";
import ExamEditModal from "./ExamEditModal";

export default function ExamsSection({
  courseId,
  showToast,
  showConfirm,
}) {
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  async function loadExams() {
    if (!courseId) return;
    setLoadingExams(true);
    try {
      const { data } = await api.get(`/exams/course/${courseId}`, {
        params: { skip: 0, limit: 1000 },
      });
      setExams(Array.isArray(data) ? data : []);
    } catch (e) {
      setExams([]);
      showToast?.(e?.response?.data?.detail || "Failed to load exams.", "error");
    } finally {
      setLoadingExams(false);
    }
  }

  useEffect(() => {
    loadExams();
  }, [courseId]);

  const sortedExams = useMemo(() => {
    const arr = Array.isArray(exams) ? [...exams] : [];
    arr.sort((a, b) => new Date(b.exam_at || 0) - new Date(a.exam_at || 0));
    return arr;
  }, [exams]);

  function onCreated(created) {
    setExams((p) => [created, ...p]);
  }

  function onUpdated(updated) {
    setExams((p) => p.map((x) => (x.id === updated.id ? updated : x)));
    setSelectedExam(updated);
  }

  function onDeleted(id) {
    setExams((p) => p.filter((x) => x.id !== id));
  }

  return (
    <>
      <ExamCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        courseId={courseId}
        onCreated={onCreated}
        showToast={showToast}
      />

      <ExamEditModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        exam={selectedExam}
        onUpdated={onUpdated}
        onDeleted={onDeleted}
        showToast={showToast}
        showConfirm={showConfirm}
      />

      <div className="course-section">
        <div className="course-section-header">
          <div>
            <h2 className="course-section-title">All Exams</h2>
            <p className="course-section-subtitle">
              {loadingExams ? "Loading exams..." : `${sortedExams.length} exam(s)`}
            </p>
          </div>

          <div className="course-inline-actions">
            <button
              className="course-btn course-btn-primary"
              onClick={() => setCreateOpen(true)}
            >
              + Add New Exam
            </button>
            <button
              className="course-btn course-btn-ghost"
              onClick={loadExams}
            >
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
          </div>
        ) : (
          <div className="course-exams-grid">
            {sortedExams.map((ex) => (
              <div key={ex.id} className="course-exam-card">
                <div className="course-exam-top">
                  <div className="course-exam-title">{ex.name}</div>
                  {ex.is_locked ? (
                    <span className="course-pill course-pill-locked">LOCKED</span>
                  ) : (
                    <span className="course-pill">ACTIVE</span>
                  )}
                </div>

                <div className="course-exam-meta">
                  <div>
                    <span className="course-label">Exam Date</span>
                    <span className="course-value">
                      {ex.exam_at
                        ? new Date(ex.exam_at).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="course-exam-actions">
                  <button
                    className="course-btn course-btn-primary course-btn-sm"
                    onClick={() => {
                      setSelectedExam(ex);
                      setEditOpen(true);
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}