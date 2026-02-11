import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Organization.css";

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

const emptyCreate = { name: "", description: "", message_template: "" };

// Toast Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`org-toast org-toast-${type}`}>
      <div className="org-toast-icon">
        {type === "success" ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" fill="currentColor"/>
          </svg>
        )}
      </div>
      <span className="org-toast-message">{message}</span>
      <button className="org-toast-close" onClick={onClose}>×</button>
    </div>
  );
}

// Confirmation Modal Component
function ConfirmModal({ isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, danger = false }) {
  if (!isOpen) return null;

  return (
    <div className="org-modal-backdrop" onMouseDown={onCancel}>
      <div className="org-confirm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="org-confirm-icon">
          {danger ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <h3 className="org-confirm-title">{title}</h3>
        <p className="org-confirm-message">{message}</p>
        <div className="org-confirm-actions">
          <button className="org-btn org-btn-ghost" onClick={onCancel}>{cancelText}</button>
          <button className={`org-btn ${danger ? 'org-btn-danger' : 'org-btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export default function Organization() {
  const { user } = useAuth();
  const canUse = useMemo(() => !!user, [user]);

  const roleName = String(user?.role_name || "").toLowerCase();
  const isOwner = roleName === "owner";
  const isGuestUser = !user?.org_id || roleName === "guest";

  const [activeTab, setActiveTab] = useState("courses");

  const [org, setOrg] = useState(null);
  const [courses, setCourses] = useState([]);

  const [loadingOrg, setLoadingOrg] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Membership
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [myInvites, setMyInvites] = useState([]);
  const [loadingMyInvites, setLoadingMyInvites] = useState(false);

  const [orgInvites, setOrgInvites] = useState([]);
  const [loadingOrgInvites, setLoadingOrgInvites] = useState(false);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    role_name: "",
    identifier: "",
    message: "",
  });

  // Leave org
  const [leaving, setLeaving] = useState(false);

  // Courses CRUD
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Show all courses toggle
  const [showAllCourses, setShowAllCourses] = useState(false);
  const INITIAL_COURSE_LIMIT = 6;

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const pendingInviteCount = Array.isArray(myInvites)
    ? myInvites.filter((x) => String(x?.status || "pending").toLowerCase() === "pending").length
    : 0;

  // Sort courses by creation date (most recent first) and limit display
  const sortedCourses = useMemo(() => {
    const sorted = [...courses].sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA; // Most recent first
    });
    return sorted;
  }, [courses]);

  const displayedCourses = showAllCourses 
    ? sortedCourses 
    : sortedCourses.slice(0, INITIAL_COURSE_LIMIT);

  const hasMoreCourses = courses.length > INITIAL_COURSE_LIMIT;

  function showToast(message, type = "success") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function showConfirm({ title, message, confirmText, cancelText, onConfirm, danger = false }) {
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
          onConfirm?.();
        },
        onCancel: () => {
          setConfirmModal({ isOpen: false });
          resolve(false);
        },
      });
    });
  }

  // ------------ LOADERS ------------
  async function loadOrg() {
    setLoadingOrg(true);
    try {
      if (isGuestUser) {
        setOrg(null);
        return;
      }
      const data = await apiFetch("/organizations/me");
      setOrg(data);
    } catch (e) {
      setOrg(null);
    } finally {
      setLoadingOrg(false);
    }
  }

  async function loadCourses() {
    setLoadingCourses(true);
    try {
      if (isGuestUser) {
        setCourses([]);
        return;
      }
      const data = await apiFetch("/courses", { params: { skip: 0, limit: 500 } });
      setCourses(Array.isArray(data) ? data : []);
    } catch (e) {
      setCourses([]);
      showToast(e.message || "Failed to load courses.", "error");
    } finally {
      setLoadingCourses(false);
    }
  }

  async function loadRoles() {
    setLoadingRoles(true);
    try {
      if (!isOwner || isGuestUser) {
        setRoles([]);
        return;
      }
      const data = await apiFetch("/membership/roles");
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }

  async function loadMembers() {
    setLoadingMembers(true);
    try {
      if (!isOwner || isGuestUser) {
        setMembers([]);
        return;
      }
      const data = await apiFetch("/membership/members");
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      setMembers([]);
      if (String(e?.message || "").toLowerCase().includes("permission")) {
        showToast("Owner permission required to view members.", "error");
      }
    } finally {
      setLoadingMembers(false);
    }
  }

  async function loadMyInvites() {
    setLoadingMyInvites(true);
    try {
      const data = await apiFetch("/membership/invitations/my");
      setMyInvites(Array.isArray(data) ? data : []);
    } catch {
      setMyInvites([]);
    } finally {
      setLoadingMyInvites(false);
    }
  }

  async function loadOrgInvites() {
    setLoadingOrgInvites(true);
    try {
      if (!isOwner || isGuestUser) {
        setOrgInvites([]);
        return;
      }
      const data = await apiFetch("/membership/invitations/org");
      setOrgInvites(Array.isArray(data) ? data : []);
    } catch {
      setOrgInvites([]);
    } finally {
      setLoadingOrgInvites(false);
    }
  }

  useEffect(() => {
    document.title = "Organization — Scanova";
    if (!canUse) return;

    loadOrg();
    loadCourses();
    loadMyInvites();

    loadRoles();
    loadMembers();
    loadOrgInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUse]);

  // ------------ COURSES CRUD ------------
  async function onCreateCourse(e) {
    e.preventDefault();
    setCreating(true);

    try {
      if (!createForm.name.trim()) {
        showToast("Course name is required.", "error");
        return;
      }

      const created = await apiFetch("/courses", {
        method: "POST",
        body: { ...createForm, name: createForm.name.trim() },
      });

      setCourses((prev) => [created, ...prev]);
      setCreateForm(emptyCreate);
      showToast("Course created successfully!");
    } catch (e2) {
      showToast(e2.message || "Failed to create course.", "error");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(course) {
    setEditingId(course.id);
    setEditForm({
      name: course.name || "",
      description: course.description || "",
      message_template: course.message_template || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function onSaveEdit(courseId) {
    setSavingEdit(true);

    try {
      const payload = { ...editForm, name: (editForm.name || "").trim() };
      if (!payload.name) {
        showToast("Course name is required.", "error");
        return;
      }

      const updated = await apiFetch(`/courses/${courseId}`, { method: "PUT", body: payload });
      setCourses((prev) => prev.map((c) => (c.id === courseId ? updated : c)));
      setEditingId(null);
      setEditForm({});
      showToast("Course updated successfully!");
    } catch (e) {
      showToast(e.message || "Failed to update course.", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function onDelete(courseId) {
    const confirmed = await showConfirm({
      title: "Delete Course",
      message: "Are you sure you want to delete this course? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    try {
      await apiFetch(`/courses/${courseId}`, { method: "DELETE" });
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      showToast("Course deleted successfully!");
    } catch (e) {
      showToast(e.message || "Failed to delete course.", "error");
    }
  }

  // ------------ MEMBERSHIP ACTIONS ------------
  function openInvite(rolePreset) {
    if (!isOwner) return showToast("Only owner can invite users.", "error");

    const preset = String(rolePreset || "").trim();
    const defaultRole = preset || roles?.[0] || "scan_operator";

    setInviteForm({ role_name: defaultRole, identifier: "", message: "" });
    setInviteOpen(true);
  }

  function closeInvite() {
    setInviteOpen(false);
    setInviting(false);
  }

  async function sendInvite(e) {
    e.preventDefault();

    if (!isOwner) {
      showToast("Only owner can invite users.", "error");
      return;
    }

    const role_name = String(inviteForm.role_name || "").trim();
    const identifier = String(inviteForm.identifier || "").trim();
    const message = String(inviteForm.message || "").trim();

    if (!role_name) return showToast("Role is required.", "error");
    if (!identifier) return showToast("Phone or Email is required.", "error");

    setInviting(true);
    try {
      await apiFetch("/membership/invite", {
        method: "POST",
        body: { identifier, role_name, message },
      });

      showToast("Invitation sent successfully!");
      closeInvite();
      loadOrgInvites();
    } catch (e2) {
      if (e2?.status === 422 && e2?.data?.detail) {
        console.error("422 detail:", e2.data.detail);
        showToast("Invite failed (422). Check console for details.", "error");
      } else {
        showToast(e2.message || "Failed to send invitation.", "error");
      }
    } finally {
      setInviting(false);
    }
  }

  async function respondInvite(requestId, action) {
    const confirmed = await showConfirm({
      title: action === "approve" ? "Accept Invitation" : "Reject Invitation",
      message: `Are you sure you want to ${action === "approve" ? "accept" : "reject"} this invitation?`,
      confirmText: action === "approve" ? "Accept" : "Reject",
      cancelText: "Cancel",
      danger: action === "reject",
    });

    if (!confirmed) return;

    try {
      await apiFetch(`/membership/invitations/${requestId}/respond`, {
        method: "POST",
        body: { action },
      });
      showToast(`Invitation ${action === "approve" ? "accepted" : "rejected"}!`);
      loadMyInvites();
      loadOrg();
      loadCourses();
      if (isOwner) {
        loadMembers();
        loadOrgInvites();
      }
    } catch (e) {
      showToast(e.message || "Failed to respond to invitation.", "error");
    }
  }

  async function removeMember(userId) {
    if (!isOwner) return showToast("Only owner can remove members.", "error");

    const confirmed = await showConfirm({
      title: "Remove Member",
      message: "Are you sure you want to remove this member from the organization?",
      confirmText: "Remove",
      cancelText: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    try {
      await apiFetch(`/membership/members/${userId}`, { method: "DELETE" });
      showToast("Member removed successfully.");
      loadMembers();
    } catch (e) {
      showToast(e.message || "Failed to remove member.", "error");
    }
  }

  async function leaveOrganization() {
    const confirmed = await showConfirm({
      title: "Leave Organization",
      message: "Are you sure you want to leave this organization? You will become a guest again.",
      confirmText: "Leave",
      cancelText: "Cancel",
      danger: true,
    });

    if (!confirmed) return;

    setLeaving(true);
    try {
      await apiFetch("/membership/leave", { method: "POST" });
      showToast("You left the organization.");
      setOrg(null);
      setCourses([]);
      setMembers([]);
      loadMyInvites();
      loadOrg();
    } catch (e) {
      showToast(e.message || "Failed to leave organization.", "error");
    } finally {
      setLeaving(false);
    }
  }

  const effectiveOrgName = org?.name || (isGuestUser ? "Guest" : "—");

  return (
    <div className="org-page">
      {/* Toast Container */}
      <div className="org-toast-container">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal {...confirmModal} />

      <div className="container org-container">
        {/* HERO */}
        <div className="org-hero">
          <div className="org-hero-content">
            <div className="org-badge">Organization Dashboard</div>

            <div className="org-hero-top">
              <div>
                <h1 className="org-hero-title">
                  {isGuestUser ? (
                    <>Join an <span className="org-gradient-text">Organization</span></>
                  ) : (
                    <>Manage Your <span className="org-gradient-text">Courses</span></>
                  )}
                </h1>
                <p className="org-hero-subtitle">
                  {isGuestUser
                    ? "You're currently a guest. Buy subscription or accept an invitation."
                    : "Create and manage courses. Owner can manage members."}
                </p>
              </div>

              {!isGuestUser && (
                <div className="org-hero-actions">
                  <button className="org-btn org-btn-danger org-btn-sm" type="button" onClick={leaveOrganization} disabled={leaving}>
                    {leaving ? "Leaving..." : "Leave Organization"}
                  </button>
                </div>
              )}
            </div>

            {/* STATS */}
            <div className="org-stats">
              <div className="org-stat-card">
                <div className="org-stat-info">
                  <div className="org-stat-value">{loadingCourses ? "—" : courses.length}</div>
                  <div className="org-stat-label">Total Courses</div>
                </div>
              </div>
              <div className="org-stat-card">
                <div className="org-stat-info">
                  <div className="org-stat-value">{loadingOrg ? "—" : effectiveOrgName}</div>
                  <div className="org-stat-label">Organization</div>
                </div>
              </div>
              <div className="org-stat-card">
                <div className="org-stat-info">
                  <div className="org-stat-value">{roleName || "user"}</div>
                  <div className="org-stat-label">Your Role</div>
                </div>
              </div>
            </div>

            {/* TABS */}
            <div className="org-tabs">
              <button className={`org-tab ${activeTab === "courses" ? "active" : ""}`} type="button" onClick={() => setActiveTab("courses")}>
                Courses
              </button>
              <button className={`org-tab ${activeTab === "users" ? "active" : ""}`} type="button" onClick={() => setActiveTab("users")}>
                User Manage {pendingInviteCount > 0 && <span className="org-tab-badge">{pendingInviteCount}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* COURSES TAB */}
        {activeTab === "courses" && (
          <>
            {isGuestUser ? (
              <div className="org-section org-section-centered">
                <div className="org-section-header">
                  <h2 className="org-section-title">Subscription Required</h2>
                </div>
                <div className="org-cta-card">
                  <div className="org-cta-left">
                    <h3>Buy subscription to create an organization</h3>
                    <p>To create courses and invite members, buy a subscription or accept an invitation.</p>
                  </div>
                  <div className="org-cta-right">
                    <button className="org-btn org-btn-primary" type="button" onClick={() => (window.location.href = "/pricing")}>
                      View Plans
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="org-content-grid">
                <div className="org-section">
                  <div className="org-section-header">
                    <h2 className="org-section-title">Create New Course</h2>
                    <div className="org-api-badge">POST /courses</div>
                  </div>

                  <form className="org-create-form" onSubmit={onCreateCourse}>
                    <div className="org-form-group">
                      <label className="org-form-label">
                        <span>Course Name</span>
                        <span className="org-form-required">*</span>
                      </label>
                      <input
                        className="org-form-input"
                        value={createForm.name}
                        onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                        disabled={creating}
                      />
                    </div>

                    <div className="org-form-group">
                      <label className="org-form-label">Description</label>
                      <textarea
                        className="org-form-input org-form-textarea"
                        value={createForm.description}
                        onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                        disabled={creating}
                        rows={3}
                      />
                    </div>

                    <div className="org-form-group">
                      <label className="org-form-label">Message Template</label>
                      <textarea
                        className="org-form-input org-form-textarea"
                        value={createForm.message_template}
                        onChange={(e) => setCreateForm((p) => ({ ...p, message_template: e.target.value }))}
                        disabled={creating}
                        rows={4}
                      />
                    </div>

                    <button className="org-btn org-btn-primary org-btn-large" type="submit" disabled={creating}>
                      {creating ? "Creating..." : "Create Course"}
                    </button>
                  </form>
                </div>

                <div className="org-section org-section-full">
                  <div className="org-section-header">
                    <div>
                      <h2 className="org-section-title">All Courses</h2>
                      <p className="org-section-subtitle">
                        {loadingCourses ? "Loading..." : `${showAllCourses ? 'Showing all' : 'Showing recent'} ${displayedCourses.length} of ${courses.length} course(s)`}
                      </p>
                    </div>
                    <div className="org-section-header-actions">
                      {hasMoreCourses && (
                        <button 
                          className="org-btn org-btn-secondary org-btn-sm" 
                          type="button" 
                          onClick={() => setShowAllCourses(!showAllCourses)}
                        >
                          {showAllCourses ? 'Show Recent' : 'Show All Courses'}
                        </button>
                      )}
                      <button className="org-btn org-btn-ghost org-btn-sm" type="button" onClick={loadCourses} disabled={loadingCourses}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </button>
                    </div>
                  </div>

                  {loadingCourses ? (
                    <div className="org-courses-loading">
                      <div className="org-loading-spinner"></div>
                      <p>Loading courses...</p>
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="org-empty-state">
                      <div className="org-empty-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3>No Courses Yet</h3>
                      <p>Create your first course to get started</p>
                    </div>
                  ) : (
                    <>
                      <div className="org-courses-grid">
                        {displayedCourses.map((course, idx) => {
                          const editing = editingId === course.id;
                          const colorIndex = idx % 6;

                          return (
                            <div key={course.id} className={`org-course-card org-course-color-${colorIndex}`}>
                              {!editing ? (
                                <>
                                  <div className="org-course-header">
                                    <div className="org-course-icon">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                      </svg>
                                    </div>
                                  </div>

                                  <div className="org-course-content">
                                    <h3 className="org-course-title">{course.name}</h3>
                                    {course.description && <p className="org-course-description">{course.description}</p>}
                                  </div>

                                  <div className="org-course-actions">
                                    <button className="org-btn org-btn-primary org-btn-sm" type="button" onClick={() => (window.location.href = `/courses/${course.id}`)}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                      Open
                                    </button>
                                    <button className="org-btn org-btn-secondary org-btn-sm" type="button" onClick={() => startEdit(course)}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <button className="org-btn org-btn-danger org-btn-sm" type="button" onClick={() => onDelete(course.id)}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      Delete
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="org-course-edit-form">
                                    <div className="org-form-group">
                                      <label className="org-form-label">Course Name</label>
                                      <input className="org-form-input" value={editForm.name ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} autoFocus />
                                    </div>
                                    <div className="org-form-group">
                                      <label className="org-form-label">Description</label>
                                      <textarea className="org-form-input org-form-textarea" value={editForm.description ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
                                    </div>
                                    <div className="org-form-group">
                                      <label className="org-form-label">Message Template</label>
                                      <textarea className="org-form-input org-form-textarea" value={editForm.message_template ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, message_template: e.target.value }))} rows={4} />
                                    </div>
                                  </div>

                                  <div className="org-course-actions">
                                    <button className="org-btn org-btn-primary org-btn-sm" type="button" disabled={savingEdit} onClick={() => onSaveEdit(course.id)}>
                                      {savingEdit ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button className="org-btn org-btn-ghost org-btn-sm" type="button" onClick={cancelEdit}>
                                      Cancel
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {hasMoreCourses && !showAllCourses && (
                        <div className="org-show-more-container">
                          <button 
                            className="org-btn org-btn-ghost org-btn-large" 
                            type="button" 
                            onClick={() => setShowAllCourses(true)}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            Show All {courses.length} Courses
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* USER MANAGE TAB */}
        {activeTab === "users" && (
          <div className="org-user-content">
            {/* Invitations */}
            <div className="org-section org-section-centered">
              <div className="org-section-header">
                <div>
                  <h2 className="org-section-title">Your Invitations</h2>
                  <p className="org-section-subtitle">{loadingMyInvites ? "Loading..." : `Pending: ${pendingInviteCount}`}</p>
                </div>
                <button className="org-btn org-btn-ghost" type="button" onClick={loadMyInvites} disabled={loadingMyInvites}>
                  Refresh
                </button>
              </div>

              {loadingMyInvites ? (
                <div className="org-courses-loading">
                  <div className="org-loading-spinner"></div>
                  <p>Loading invitations...</p>
                </div>
              ) : myInvites.length === 0 ? (
                <div className="org-empty-state">
                  <div className="org-empty-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3>No Invitations</h3>
                  <p>You don't have any pending invitations</p>
                </div>
              ) : (
                <div className="org-list">
                  {myInvites.map((inv) => {
                    const id = inv.id || inv.request_id;
                    return (
                      <div key={id} className="org-list-row">
                        <div className="org-list-main">
                          <div className="org-list-title">
                            Role: <b>{inv.role_name || inv.role || "—"}</b>
                            <span className="org-pill">{String(inv.status || "pending").toUpperCase()}</span>
                          </div>
                          <div className="org-list-sub">
                            {inv.org_name ? `Organization: ${inv.org_name}` : null}
                            {inv.message ? ` • Message: ${inv.message}` : null}
                          </div>
                        </div>
                        <div className="org-list-actions">
                          <button className="org-btn org-btn-primary org-btn-sm" type="button" onClick={() => respondInvite(id, "approve")} disabled={!isGuestUser}>
                            Accept
                          </button>
                          <button className="org-btn org-btn-secondary org-btn-sm" type="button" onClick={() => respondInvite(id, "reject")}>
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Owner-only Member Management */}
            {!isGuestUser && (
              <div className="org-section org-section-centered">
                <div className="org-section-header">
                  <div>
                    <h2 className="org-section-title">Member Management</h2>
                    <p className="org-section-subtitle">Only Owner can invite/remove members.</p>
                  </div>

                  {isOwner ? (
                    <div className="org-inline-actions">
                      <button className="org-btn org-btn-secondary" type="button" onClick={() => openInvite("scan_operator")} disabled={loadingRoles}>
                        + Add Scanner
                      </button>
                      <button className="org-btn org-btn-primary" type="button" onClick={() => openInvite("organization_admin")} disabled={loadingRoles}>
                        + Add Admin
                      </button>
                      <button
                        className="org-btn org-btn-ghost"
                        type="button"
                        onClick={() => {
                          loadRoles();
                          loadMembers();
                          loadOrgInvites();
                        }}
                      >
                        Refresh
                      </button>
                    </div>
                  ) : (
                    <div className="org-api-badge">Owner Only</div>
                  )}
                </div>

                {!isOwner ? (
                  <div className="org-empty-state">
                    <div className="org-empty-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3>Owner Only</h3>
                    <p>You are not the owner, so you can't invite/remove members.</p>
                  </div>
                ) : (
                  <>
                    <div className="org-subsection">
                      <div className="org-subheader">
                        <h3>Members</h3>
                        <span className="org-subhint">{loadingMembers ? "Loading..." : `${members.length} member(s)`}</span>
                      </div>

                      {loadingMembers ? (
                        <div className="org-courses-loading">
                          <div className="org-loading-spinner"></div>
                          <p>Loading members...</p>
                        </div>
                      ) : members.length === 0 ? (
                        <div className="org-empty-state">
                          <h3>No members</h3>
                        </div>
                      ) : (
                        <div className="org-list">
                          {members.map((m) => (
                            <div key={m.id} className="org-list-row">
                              <div className="org-list-main">
                                <div className="org-list-title">
                                  <b>{m.full_name || m.email || m.phone || "Member"}</b>
                                  <span className="org-pill">{String(m.role_name || "member")}</span>
                                </div>
                              </div>
                              <div className="org-list-actions">
                                <button
                                  className="org-btn org-btn-danger org-btn-sm"
                                  type="button"
                                  onClick={() => removeMember(m.id)}
                                  disabled={m.id === user?.id}
                                  title={m.id === user?.id ? "You can't remove yourself here (use Leave Organization)" : ""}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="org-subsection">
                      <div className="org-subheader">
                        <h3>Sent Invitations</h3>
                        <span className="org-subhint">{loadingOrgInvites ? "Loading..." : `${orgInvites.length} invitation(s)`}</span>
                      </div>

                      {loadingOrgInvites ? (
                        <div className="org-courses-loading">
                          <div className="org-loading-spinner"></div>
                          <p>Loading invitations...</p>
                        </div>
                      ) : orgInvites.length === 0 ? (
                        <div className="org-empty-state">
                          <h3>No invitations sent</h3>
                        </div>
                      ) : (
                        <div className="org-list">
                          {orgInvites.map((inv) => (
                            <div key={inv.id || inv.request_id} className="org-list-row">
                              <div className="org-list-main">
                                <div className="org-list-title">
                                  To: <b>{inv.user_identifier || inv.user_phone || inv.user_email || "—"}</b>
                                  <span className="org-pill">{String(inv.role_name || inv.role || "—")}</span>
                                  <span className="org-pill">{String(inv.status || "pending").toUpperCase()}</span>
                                </div>
                                <div className="org-list-sub">{inv.message ? `Message: ${inv.message}` : null}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* INVITE MODAL */}
        {inviteOpen && (
          <div className="org-modal-backdrop" onMouseDown={closeInvite}>
            <div className="org-modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="org-modal-header">
                <div>
                  <h3 className="org-modal-title">Invite a User</h3>
                  <p className="org-modal-subtitle">Send an invitation to join your organization</p>
                </div>
                <button className="org-modal-close" type="button" onClick={closeInvite}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <form className="org-modal-body" onSubmit={sendInvite}>
                <div className="org-form-group">
                  <label className="org-form-label">Role</label>
                  <select
                    className="org-form-input"
                    value={inviteForm.role_name}
                    onChange={(e) => setInviteForm((p) => ({ ...p, role_name: e.target.value }))}
                    disabled={inviting}
                  >
                    {(roles.length ? roles : ["organization_admin", "scan_operator"]).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="org-form-group">
                  <label className="org-form-label">
                    Phone or Email <span className="org-form-required">*</span>
                  </label>
                  <input
                    className="org-form-input"
                    placeholder="e.g., +8801700000006 or user@mail.com"
                    value={inviteForm.identifier}
                    onChange={(e) => setInviteForm((p) => ({ ...p, identifier: e.target.value }))}
                    disabled={inviting}
                  />
                  <p className="org-form-hint">Enter the email address or phone number of the person you want to invite</p>
                </div>

                <div className="org-form-group">
                  <label className="org-form-label">Message (Optional)</label>
                  <textarea
                    className="org-form-input org-form-textarea"
                    rows={4}
                    placeholder="Add a personal message to your invitation..."
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm((p) => ({ ...p, message: e.target.value }))}
                    disabled={inviting}
                  />
                </div>

                <div className="org-modal-footer">
                  <button className="org-btn org-btn-ghost" type="button" onClick={closeInvite} disabled={inviting}>
                    Cancel
                  </button>
                  <button className="org-btn org-btn-primary" type="submit" disabled={inviting}>
                    {inviting ? (
                      <>
                        <div className="org-btn-spinner"></div>
                        Sending...
                      </>
                    ) : (
                      "Send Invitation"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}