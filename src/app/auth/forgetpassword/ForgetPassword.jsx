"use client";
import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; 
import toast, { Toaster } from 'react-hot-toast';
import LoginLogo from "../../../assets/images/logo.png";

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleSendOtp = (e) => {
    e.preventDefault();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Static Demo Check
    if (email === "test@gmail.com") {
      toast.success("OTP sent successfully!");
      setTimeout(() => {
        router.push('/auth/otp'); 
      }, 1500);
    } else {
      toast.error("Email not found in our records");
    }
  };
  return (
    <div id='ForgetPassword'>
      <Toaster position="top-right" />
         <div className="LoginBox">
        <div className="LoginLeft">
          <div className="LoginLogoBox">
            <Image src={LoginLogo} alt="Logo" className="LoginImg" />
          </div>

          <div className="LoginWelcomeTxt">
            <h1>Forget Your Password</h1>
            <p>Join our yoga community today.</p>
          </div>

          <form className="InputGroup" onSubmit={handleSendOtp}>
            <label htmlFor="email">Enter Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="example@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <button type="submit" className="otpBtn">Send OTP</button>
          </form>
        </div>

        <div className="LoginRight">
          <div className="LoginRightOverlay">
            <p className="quote">Yoga is not just about flexibility; it&apos;s about finding balance within yourself...</p>
            <p className="author">Sofia, Yoga & Wellness Practitioner</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgetPassword