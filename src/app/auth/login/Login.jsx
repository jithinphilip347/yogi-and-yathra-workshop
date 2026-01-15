"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import LoginLogo from "../../../assets/images/logo.png";
import LoginGoogle from "../../../assets/images/google.png";
import Image from "next/image";
import Link from "next/link";

const Login = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      if (formData.email === "test@gmail.com" && formData.password === "123456") {
        toast.success("Login Successfully!");
        
        setTimeout(() => {
          router.push("/auth/profile");
        }, 1500);
      } else {
        toast.error("Invalid email or password. Please try again.");
      }
    } else {
      toast.error("Please fix the errors in the form.");
    }
  };

  return (
    <div id="Login">
      <Toaster position="top-right" reverseOrder={false} />
      
      <div className="LoginBox">
        <div className="LoginLeft">
          <div className="LoginLogoBox">
            <Image src={LoginLogo} alt="Login Logo" className="LoginImg" />
          </div>

          <div className="LoginWelcomeTxt">
            <h1>Start Your Journey!</h1>
            <p>Welcome back! Step onto your mat and continue your path to mindfulness and inner strength.</p>
          </div>

          <form className="LoginForm" onSubmit={handleSubmit}>
            <div className="InputGroup">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="Enter your Email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              {errors.email && <span className="ErrorTxt">{errors.email}</span>}
            </div>

            <div className="InputGroup">
              <label>Password</label>
              <div className="PasswordWrap">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your Password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <span className="EyeIcon" onClick={togglePasswordVisibility}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
              {errors.password && <span className="ErrorTxt">{errors.password}</span>}
            </div>

            <div className="ForgetPassword">
              <Link href="/auth/forgetpassword">Forgot Password?</Link>
            </div>

            <button type="submit" className="LoginBtn">Log In</button>
          </form>

          <div className="OrText"><span>OR</span></div>

          <div className="SocialLogin">
            <button className="SocialBtn" type="button">
              <Image src={LoginGoogle} alt="Google" width={20} height={20} />
              <span>Continue with Google</span>
            </button>
          </div>

          <p className="SignUpTxt">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="SignupLink">Sign Up ›</Link>
          </p>
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

export default Login;