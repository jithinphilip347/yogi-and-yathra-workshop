"use client";

import React, { useState } from 'react';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import LoginLogo from "../../../assets/images/logo.png";

const ChangePassword = () => {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const handleUpdate = (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    toast.success("Password changed successfully!");
    
    setTimeout(() => {
      router.push('/auth/login');
    }, 2000);
  };

  return (
    <div id='ChangePassword'>
      <Toaster position="top-right" />
      <div className="LoginBox">
        <div className="LoginLeft">
          <div className="LoginLogoBox">
            <Image src={LoginLogo} alt="Login Logo" className="LoginImg" />
          </div>
          <div className="LoginWelcomeTxt">
            <h1>Create New Password</h1>
            <p>Please enter your new password to secure your account.</p>
          </div>

          <form className="ChangePasswordBox" onSubmit={handleUpdate}>
            <div className="InputFieldGroup">
              <label>New Password</label>
              <div className="InputWrapper">
                <input 
                  type={showPass ? "text" : "password"} 
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
                <div className="EyeIcon" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </div>
              </div>
            </div>

            <div className="InputFieldGroup">
              <label>Confirm New Password</label>
              <div className="InputWrapper">
                <input 
                  type={showConfirmPass ? "text" : "password"} 
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                />
                <div className="EyeIcon" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                  {showConfirmPass ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </div>
              </div>
            </div>

            <button type="submit" className="otpBtn">Update Password</button>
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
  );
};

export default ChangePassword;