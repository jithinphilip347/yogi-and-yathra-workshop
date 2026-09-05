"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CertificateVerifyCodeRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code;

  useEffect(() => {
    if (code) {
      router.replace(`/certificates/verify?verification_code=${encodeURIComponent(code)}`);
    } else {
      router.replace("/certificates/verify");
    }
  }, [code, router]);

  return (
    <div style={{ padding: "80px 20px", textAlign: "center", minHeight: "60vh" }}>
      <p style={{ color: "#64748b" }}>Redirecting to verification details...</p>
    </div>
  );
}
