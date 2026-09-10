"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import Image from "next/image";
import LoginLogo from "@/assets/images/logo.png";
import authApi from "@/libs/authApi";
import { setLogin } from "@/features/auth/authSlice";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const [statusText, setStatusText] = useState("Authenticating with Google...");
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const code = searchParams.get("code");

    if (error) {
      const message =
        error === "access_denied"
          ? "Google sign-in was cancelled."
          : errorDescription || "Google authentication failed.";
      toast.error(message);
      router.replace("/auth/login");
      return;
    }

    if (!code) {
      toast.error("No authorization code received from Google.");
      router.replace("/auth/login");
      return;
    }

    const processGoogleAuth = async () => {
      try {
        setStatusText("Verifying credentials...");
        const res = await authApi.googleCallback({ code });

        dispatch(setLogin(res.data));
        toast.success("Signed in successfully with Google!");

        // Check if items exist in guest checkout or cart
        const state = window.__REDUX_STORE__?.getState?.() || {};
        const checkoutItems = state.checkout?.items || [];
        const cartItems = state.cart?.items || [];

        if (checkoutItems.length > 0 || cartItems.length > 0) {
          router.replace("/checkout");
        } else {
          router.replace("/");
        }
      } catch (err) {
        console.error("Google Auth Error:", err);
        const errMsg =
          err?.response?.data?.message ||
          err?.response?.data?.errors?.email?.[0] ||
          err?.response?.data?.errors?.code?.[0] ||
          "Google authentication failed. Please try again.";
        toast.error(errMsg);
        router.replace("/auth/login");
      }
    };

    processGoogleAuth();
  }, [searchParams, router, dispatch]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <Image src={LoginLogo} alt="Yogify" width={140} height={45} priority />
      </div>
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid rgba(0, 0, 0, 0.1)",
          borderTopColor: "#3b82f6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          marginBottom: "1rem",
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ color: "#4b5563", fontSize: "1.1rem", fontWeight: 500 }}>
        {statusText}
      </p>
      <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginTop: "0.5rem" }}>
        Please wait while we connect your account.
      </p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "70vh",
          }}
        >
          <p style={{ color: "#6b7280" }}>Loading Google Authentication...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
