"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/services/apiClient";
import Link from "next/link";
import { 
  FiAward, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiSearch, 
  FiCalendar, 
  FiUser, 
  FiBookOpen, 
  FiShield, 
  FiExternalLink,
  FiArrowLeft,
  FiLoader
} from "react-icons/fi";

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("verification_code") || searchParams.get("code") || "";

  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const performVerification = async (verifyCode) => {
    const trimmed = (verifyCode || "").trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);

    try {
      const response = await apiClient.get("certificates/verify", {
        params: { verification_code: trimmed },
      });

      if (response.data?.success && response.data?.data) {
        setResult(response.data.data);
      } else {
        setError(response.data?.message || "Certificate could not be verified.");
      }
    } catch (err) {
      console.error("Certificate verification error:", err);
      const msg =
        err.response?.data?.message ||
        "Certificate not found or verification code is invalid. Please check the code and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      performVerification(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) {
      performVerification(code.trim());
    }
  };

  const certData = result?.certificate;
  const isValid = result?.is_valid;
  const statusLabel = result?.status_label || (isValid ? "Valid & Verified" : "Invalid");

  return (
    <div style={{
      minHeight: "80vh",
      backgroundColor: "#f8fafc",
      padding: "60px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{
        maxWidth: "720px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            backgroundColor: "rgba(135, 68, 41, 0.1)",
            color: "var(--primaryColor, #874429)",
            fontSize: "28px",
            marginBottom: "16px"
          }}>
            <FiShield />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>
            Certificate Verification Portal
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
            Verify the authenticity and integrity of Yogify certificates issued for workshops, live sections, and courses.
          </p>
        </div>

        {/* Search Card */}
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "24px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)"
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <FiSearch style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "18px"
              }} />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter Certificate Verification Code or ID..."
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              style={{
                padding: "12px 24px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "var(--primaryColor, #874429)",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "14px",
                cursor: loading || !code.trim() ? "not-allowed" : "pointer",
                opacity: loading || !code.trim() ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "background-color 0.2s"
              }}
            >
              {loading ? (
                <>
                  <FiLoader style={{ animation: "spin 1s linear infinite" }} />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <FiSearch />
                  <span>Verify Now</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Result */}
        {loading && (
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "40px",
            textAlign: "center"
          }}>
            <FiLoader style={{ fontSize: "36px", color: "var(--primaryColor, #874429)", animation: "spin 1s linear infinite", marginBottom: "12px" }} />
            <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
              Checking Authenticity...
            </h4>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
              Verifying cryptographic record and student attendance data.
            </p>
          </div>
        )}

        {!loading && error && searched && (
          <div style={{
            backgroundColor: "#fef2f2",
            borderRadius: "16px",
            border: "1px solid #fecaca",
            padding: "24px",
            display: "flex",
            alignItems: "flex-start",
            gap: "16px"
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0
            }}>
              <FiAlertCircle />
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#991b1b", margin: "0 0 4px 0" }}>
                Verification Failed
              </h3>
              <p style={{ fontSize: "13px", color: "#b91c1c", margin: 0, lineHeight: 1.5 }}>
                {error}
              </p>
            </div>
          </div>
        )}

        {!loading && result && certData && (
          <div style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: isValid ? "1px solid #bbf7d0" : "1px solid #fecaca",
            overflow: "hidden",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)"
          }}>
            {/* Status Banner */}
            <div style={{
              backgroundColor: isValid ? "#f0fdf4" : "#fef2f2",
              padding: "16px 24px",
              borderBottom: isValid ? "1px solid #dcfce7" : "1px solid #fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  color: isValid ? "#16a34a" : "#dc2626",
                  fontSize: "22px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  {isValid ? <FiCheckCircle /> : <FiAlertCircle />}
                </div>
                <div>
                  <span style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: isValid ? "#166534" : "#991b1b"
                  }}>
                    {isValid ? "Authentic Verified Certificate" : "Certificate Invalid or Revoked"}
                  </span>
                  <div style={{ fontSize: "12px", color: isValid ? "#15803d" : "#b91c1c" }}>
                    Status: <strong>{statusLabel}</strong>
                  </div>
                </div>
              </div>

              <div style={{
                fontSize: "12px",
                fontWeight: "600",
                padding: "4px 12px",
                borderRadius: "20px",
                backgroundColor: isValid ? "#dcfce7" : "#fee2e2",
                color: isValid ? "#15803d" : "#991b1b"
              }}>
                Official Yogify Record
              </div>
            </div>

            {/* Certificate Details */}
            <div style={{ padding: "24px" }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "20px"
              }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>
                    Recipient Student
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiUser style={{ color: "var(--primaryColor, #874429)" }} />
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                      {certData.student_name || "Enrolled Student"}
                    </strong>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>
                    Learning Experience / Title
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiBookOpen style={{ color: "var(--primaryColor, #874429)" }} />
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                      {certData.entity?.title || "Live Section"}
                    </strong>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>
                    Certificate Number
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiAward style={{ color: "var(--primaryColor, #874429)" }} />
                    <span style={{ fontSize: "14px", fontFamily: "monospace", fontWeight: "700", color: "#0f172a" }}>
                      {certData.certificate_number}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>
                    Issued On
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FiCalendar style={{ color: "var(--primaryColor, #874429)" }} />
                    <span style={{ fontSize: "14px", color: "#334155" }}>
                      {certData.issued_at
                        ? new Date(certData.issued_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Verified"}
                    </span>
                  </div>
                </div>

                {certData.entity?.type && (
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>
                      Program Type
                    </span>
                    <span style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      backgroundColor: "#f1f5f9",
                      color: "#475569"
                    }}>
                      {certData.entity.type === "LiveSection"
                        ? "Live Workshop Section"
                        : certData.entity.type}
                    </span>
                  </div>
                )}

                {certData.template && (
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500", display: "block", marginBottom: "4px" }}>
                      Certificate Template
                    </span>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                      {certData.template}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "16px 24px",
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px"
            }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Cryptographically signed and verified by Yogify Education Engine.
              </span>

              <Link
                href="/"
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--primaryColor, #874429)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <FiArrowLeft />
                <span>Return to Yogify</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CertificateVerificationPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <FiLoader style={{ fontSize: "32px", color: "#874429", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "12px", color: "#64748b" }}>Loading verification portal...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
