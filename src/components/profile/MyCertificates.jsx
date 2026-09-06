"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FiAward,
  FiDownload,
  FiEye,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiExternalLink,
  FiLoader,
  FiBookOpen,
  FiCalendar,
  FiActivity,
  FiStar,
} from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { useSelector } from "react-redux";
import apiClient from "@/services/apiClient";
import courseApi from "@/libs/courseApi";
import CertificateViewerModal from "@/components/certificate/CertificateViewerModal";
import toast from "react-hot-toast";
import Link from "next/link";

const sourceTypeBadges = {
  course: { label: "Course", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: FiBookOpen },
  daily_class: { label: "Daily Class", bg: "#faf5ff", color: "#7e22ce", border: "#e9d5ff", icon: FiCalendar },
  live_section: { label: "Live Session", bg: "#fffbeb", color: "#b45309", border: "#fde68a", icon: FiActivity },
};

export default function MyCertificates({ user }) {
  const authUser = useSelector((state) => state.auth?.user) || user;
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'issued' | 'in_progress'

  // Certificate Viewer Modal State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [claimingKey, setClaimingKey] = useState(null);

  const fetchCertificates = useCallback(async () => {
    if (!authUser?.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`certificates/students/${authUser.id}`);
      const data = res.data?.data || res.data;
      setOverview(data);
    } catch (err) {
      console.error("Failed to load certificates overview:", err);
      setError(err?.response?.data?.message || "Failed to load your certificates.");
    } finally {
      setLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const summary = overview?.summary || {
    total_issued: 0,
    total_eligible: 0,
    total_in_progress: 0,
  };

  const issuedList = Array.isArray(overview?.issued) ? overview.issued : [];
  const inProgressList = Array.isArray(overview?.in_progress) ? overview.in_progress : [];

  const handleOpenViewer = (cert) => {
    setSelectedCertificate(cert);
    setSelectedEntity({
      title: cert.source?.title,
      instructor: cert.source?.instructor_name,
    });
    setIsViewerOpen(true);
  };

  const handleClaim = async (item) => {
    const key = `${item.source?.type}_${item.source?.id}`;
    try {
      setClaimingKey(key);
      let res;
      if (item.source?.type === "daily_class") {
        res = await courseApi.claimDailyClassCertificate(item.source.id);
      } else if (item.source?.type === "live_section") {
        res = await courseApi.claimLiveSectionCertificate(item.source.id);
      } else {
        res = await courseApi.claimCertificate(item.source.id);
      }

      const certData = res.data?.data || res.data;
      toast.success("Certificate claimed successfully! 🎉");
      
      // Refresh overview
      await fetchCertificates();

      // Open viewer
      setSelectedCertificate(certData);
      setSelectedEntity({
        title: item.source?.title,
        instructor: item.source?.instructor_name,
      });
      setIsViewerOpen(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to claim certificate");
    } finally {
      setClaimingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="MyCertificatesTab" style={{ padding: "10px 0" }}>
        <div className="DashBoardHead" style={{ marginBottom: "20px" }}>
          <h2>My Certificates</h2>
          <p>Loading your certificates and learning achievements...</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "90px", background: "#f1f5f9", borderRadius: "12px", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
        <div style={{ height: "180px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="MyCertificatesTab" style={{ padding: "20px 0", textAlign: "center" }}>
        <div style={{ maxWidth: "400px", margin: "0 auto", padding: "30px 20px", background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca" }}>
          <FiAlertCircle style={{ fontSize: "36px", color: "#dc2626", marginBottom: "12px" }} />
          <h3 style={{ fontSize: "18px", color: "#991b1b", marginBottom: "8px" }}>Unable to Load Certificates</h3>
          <p style={{ fontSize: "14px", color: "#b91c1c", marginBottom: "16px" }}>{error}</p>
          <button
            onClick={fetchCertificates}
            style={{ padding: "8px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isTotallyEmpty = issuedList.length === 0 && inProgressList.length === 0;

  return (
    <div className="MyCertificatesTab">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="DashBoardHead" style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", marginBottom: "4px" }}>
          My Certificates
        </h2>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          View, download, and publicly verify your yoga course & workshop completion certificates.
        </p>
      </div>

      {/* ─── Summary Cards ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {/* Issued */}
        <div
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
            border: "1px solid #bbf7d0",
            borderRadius: "14px",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#15803d", margin: 0 }}>
              Earned Certificates
            </p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: "4px 0 0" }}>
              {summary.total_issued ?? issuedList.length}
            </p>
          </div>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            <FiAward />
          </div>
        </div>

        {/* Eligible */}
        <div
          style={{
            background: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
            border: "1px solid #99f6e4",
            borderRadius: "14px",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#0f766e", margin: 0 }}>
              Ready to Claim
            </p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: "4px 0 0" }}>
              {summary.total_eligible}
            </p>
          </div>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#ccfbf1", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            <FiStar />
          </div>
        </div>

        {/* In Progress */}
        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: "14px",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#1d4ed8", margin: 0 }}>
              In Progress
            </p>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: "4px 0 0" }}>
              {summary.total_in_progress ?? inProgressList.length}
            </p>
          </div>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
            <FiClock />
          </div>
        </div>
      </div>

      {/* ─── Filter Tabs ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveFilter("all")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: activeFilter === "all" ? "var(--primaryColor, #8B3A1C)" : "#f1f5f9",
            color: activeFilter === "all" ? "#fff" : "#475569",
            fontWeight: "600",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          All ({issuedList.length + inProgressList.length})
        </button>
        <button
          onClick={() => setActiveFilter("issued")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: activeFilter === "issued" ? "var(--primaryColor, #8B3A1C)" : "#f1f5f9",
            color: activeFilter === "issued" ? "#fff" : "#475569",
            fontWeight: "600",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Earned ({issuedList.length})
        </button>
        <button
          onClick={() => setActiveFilter("in_progress")}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: activeFilter === "in_progress" ? "var(--primaryColor, #8B3A1C)" : "#f1f5f9",
            color: activeFilter === "in_progress" ? "#fff" : "#475569",
            fontWeight: "600",
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          In Progress & Eligible ({inProgressList.length})
        </button>
      </div>

      {/* ─── Total Empty State ───────────────────────────────────────────── */}
      {isTotallyEmpty && (
        <div className="EmptyState" style={{ textAlign: "center", padding: "50px 20px" }}>
          <div className="EmptyIcon" style={{ width: "64px", height: "64px", margin: "0 auto 16px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px" }}>
            <FiAward />
          </div>
          <h3 style={{ fontSize: "18px", color: "#1e293b", marginBottom: "8px" }}>No Certificates Yet</h3>
          <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "420px", margin: "0 auto 20px" }}>
            Complete your enrolled courses or attend required live yoga classes to earn verified certificates.
          </p>
          <Link href="/course">
            <button className="ExploreBtn" style={{ padding: "10px 24px", background: "var(--primaryColor, #8B3A1C)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
              Explore Courses
            </button>
          </Link>
        </div>
      )}

      {/* ─── 1. Earned Certificates Section ──────────────────────────────── */}
      {(activeFilter === "all" || activeFilter === "issued") && issuedList.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FiCheckCircle style={{ color: "#16a34a" }} />
            Earned Certificates
            <span style={{ fontSize: "12px", background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
              {issuedList.length}
            </span>
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
            {issuedList.map((cert) => {
              const badge = sourceTypeBadges[cert.source?.type] || {
                label: cert.source?.type || "Entity",
                bg: "#f1f5f9",
                color: "#475569",
                border: "#cbd5e1",
                icon: FiAward,
              };
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={cert.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div style={{ flex: "1 1 300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          padding: "2px 10px",
                          borderRadius: "12px",
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        <BadgeIcon size={12} />
                        {badge.label}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontFamily: "monospace",
                          fontWeight: "600",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "#f8fafc",
                          color: "#64748b",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {cert.certificate_number}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px" }}>
                      {cert.source?.title || "Certificate of Completion"}
                    </h4>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "12px", color: "#64748b" }}>
                      {cert.issued_at && (
                        <span>
                          <strong>Issued:</strong>{" "}
                          {new Date(cert.issued_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {cert.source?.instructor_name && (
                        <span>
                          <strong>Instructor:</strong> {cert.source.instructor_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    {cert.verification_url && (
                      <a
                        href={cert.verification_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          background: "#f8fafc",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "600",
                          textDecoration: "none",
                          cursor: "pointer",
                        }}
                      >
                        <FiExternalLink />
                        Verify
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenViewer(cert)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 18px",
                        background: "var(--primaryColor, #8B3A1C)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(139,58,28,0.2)",
                      }}
                    >
                      <FiEye />
                      View & Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 2. In-Progress & Eligible Section ───────────────────────────── */}
      {(activeFilter === "all" || activeFilter === "in_progress") && inProgressList.length > 0 && (
        <div>
          <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#1e293b", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FiClock style={{ color: "#2563eb" }} />
            In Progress & Eligible Pathways
            <span style={{ fontSize: "12px", background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
              {inProgressList.length}
            </span>
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
            {inProgressList.map((item, idx) => {
              const badge = sourceTypeBadges[item.source?.type] || {
                label: item.source?.type || "Entity",
                bg: "#f1f5f9",
                color: "#475569",
                border: "#cbd5e1",
                icon: FiBookOpen,
              };
              const BadgeIcon = badge.icon;

              const isAttendance = item.progress?.attendance_percentage !== undefined;
              const currentProgress = isAttendance
                ? item.progress.attendance_percentage
                : item.progress?.completion_percentage ?? 0;
              const requiredProgress = isAttendance
                ? item.progress?.required_attendance_percentage ?? 70
                : item.progress?.required_completion_percentage ?? 100;

              const isEligible = item.is_eligible || item.status === "eligible";
              const key = `${item.source?.type}_${item.source?.id}`;
              const isClaiming = claimingKey === key;

              return (
                <div
                  key={item.enrollment_id || idx}
                  style={{
                    background: isEligible ? "#f0fdf4" : "#ffffff",
                    border: isEligible ? "1px solid #86efac" : "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div style={{ flex: "1 1 300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          padding: "2px 10px",
                          borderRadius: "12px",
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                        }}
                      >
                        <BadgeIcon size={12} />
                        {badge.label}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          background: isEligible ? "#dcfce7" : "#eff6ff",
                          color: isEligible ? "#15803d" : "#1d4ed8",
                        }}
                      >
                        {isEligible ? "✓ Eligible to Claim" : "In Progress"}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px" }}>
                      {item.source?.title}
                    </h4>

                    {item.reason && (
                      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px" }}>
                        {item.reason}
                      </p>
                    )}

                    {item.source?.instructor_name && (
                      <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                        Instructor: {item.source.instructor_name}
                      </p>
                    )}
                  </div>

                  <div style={{ width: "220px", flexShrink: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span style={{ color: "#64748b", fontWeight: "500" }}>
                        {isAttendance ? "Attendance" : "Progress"}
                      </span>
                      <span style={{ fontWeight: "700", color: isEligible ? "#16a34a" : "#1e293b" }}>
                        {currentProgress}% / {requiredProgress}%
                      </span>
                    </div>

                    <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden", marginBottom: "12px" }}>
                      <div
                        style={{
                          width: `${Math.min(100, currentProgress)}%`,
                          height: "100%",
                          background: isEligible ? "#16a34a" : "#2563eb",
                          borderRadius: "999px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>

                    {isEligible ? (
                      <button
                        onClick={() => handleClaim(item)}
                        disabled={isClaiming}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          background: "#16a34a",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          boxShadow: "0 2px 4px rgba(22,163,74,0.2)",
                        }}
                      >
                        {isClaiming ? <FiLoader className="spin" /> : <FiAward />}
                        <span>{isClaiming ? "Claiming..." : "Claim Certificate"}</span>
                      </button>
                    ) : (
                      <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "right", margin: 0 }}>
                        {requiredProgress - currentProgress}% required to unlock
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Certificate Viewer & Exporter Modal ─────────────────────────── */}
      <CertificateViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedCertificate(null);
          setSelectedEntity(null);
        }}
        certificate={selectedCertificate}
        activeEntity={selectedEntity}
        course={selectedEntity}
      />
    </div>
  );
}
