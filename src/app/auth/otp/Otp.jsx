"use client";

import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import LoginLogo from "../../../assets/images/logo.png";
import { useRouter } from 'next/navigation';

const Otp = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(240); 
  const inputRefs = useRef([]);
  const router = useRouter();

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const canResend = timer === 0;

  const formatTime = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
  const finalOtp = otp.join("");
  if (finalOtp === "123456") {
    toast.success("OTP Verified Successfully!");
    setTimeout(() => {
      router.push('/auth/changepassword'); // Navigate to the new page
    }, 1500);
  }
     else {
      toast.error("Invalid OTP. Please try again.", {
        style: { color: 'red', fontWeight: 'bold' }
      });
    }
  };

  const handleResend = () => {
    setTimer(240);
    toast.success("Resend OTP sent successfully!");
  };

  return (
    <div id='Otp'>
      <Toaster position="top-right" />
      <div className="LoginBox">
        <div className="LoginLeft">
          <div className="LoginLogoBox">
            <Image src={LoginLogo} alt="Logo" className="LoginImg" />
          </div>

          <div className="LoginWelcomeTxt">
            <h1>Verify Your OTP</h1>
            <p>Join our yoga community today.</p>
          </div>

          <div className='OtpEnterBox'>
            <div className="OtpInputs">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              ))}
            </div>

            <div className="ResendContainer">
              {!canResend ? (
                <p>Resend in <span className="timerText">{formatTime()}</span></p>
              ) : (
                <p>Didn&apos;t get the OTP? <span onClick={handleResend} className="resendLink">Resend</span></p>
              )}
            </div>

            <button onClick={handleVerify} className="otpBtn">Verify OTP</button>
          </div>
        </div>

        <div className="LoginRight">
          <div className="LoginRightOverlay">
            <p className="quote">Yoga is not just about flexibility; it&apos;s about finding balance within yourself...</p>
            <p className="author">Sofia, Yoga & Wellness Practitioner</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Otp;