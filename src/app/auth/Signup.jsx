"use client";
import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import LoginLogo from "../../assets/images/logo.png";
import LoginGoogle from "../../assets/images/google.png";
import Image from "next/image";
import Link from "next/link";

const Signup = () => {
  const [step, setStep] = useState(1); // Track form step
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState("");
  
  const [formData, setFormData] = useState({
    name: "", email: "", mobile: "", password: "", confirmPassword: "",
    whatsapp: "", location: "", age: "", height: "", weight: "", otherIssue: ""
  });
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.mobile) newErrors.mobile = "Mobile is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) newErrors.confirm = "Passwords do not match";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Final Signup Data:", formData);
  };

  return (
    <div id="Signup">
      <div className="LoginBox">
        <div className="LoginLeft">
          <div className="LoginLogoBox">
            <Image src={LoginLogo} alt="Logo" className="LoginImg" />
          </div>

          <div className="LoginWelcomeTxt">
            <h1>Create Account</h1>
            <p>Join our yoga community today.</p>
          </div>

          <form className="LoginForm" onSubmit={step === 1 ? handleContinue : handleSubmit}>
            {step === 1 ? (
              <>
                {/* STEP 1 FIELDS */}
                <div className="InputGroup">
                  <label>Full Name</label>
                  <input type="text" placeholder="Name" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} />
                  {errors.name && <span className="ErrorTxt">{errors.name}</span>}
                </div>

                <div className="InputGroup">
                  <label>Email</label>
                  <input type="email" placeholder="Email" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} />
                  {errors.email && <span className="ErrorTxt">{errors.email}</span>}
                </div>

                <div className="FormRow">
                  <div className="InputGroup">
                    <label>Mobile Number</label>
                    <input type="number" placeholder="Mobile" onChange={(e)=>setFormData({...formData, mobile: e.target.value})} />
                  </div>
                  <div className="InputGroup">
                    <label>WhatsApp Number</label>
                    <input type="number" placeholder="WhatsApp" onChange={(e)=>setFormData({...formData, whatsapp: e.target.value})} />
                  </div>
                </div>

                <div className="InputGroup">
                  <label>Password</label>
                  <div className="PasswordWrap">
                    <input type={showPassword ? "text" : "password"} placeholder="Password" onChange={(e)=>setFormData({...formData, password: e.target.value})} />
                    <span className="EyeIcon" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                </div>

                <div className="InputGroup">
                  <label>Confirm Password</label>
                  <div className="PasswordWrap">
                    <input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm" onChange={(e)=>setFormData({...formData, confirmPassword: e.target.value})} />
                    <span className="EyeIcon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                  {errors.confirm && <span className="ErrorTxt">{errors.confirm}</span>}
                </div>

                <button type="submit" className="LoginBtn">Continue</button>
              </>
            ) : (
              <>
                {/* STEP 2 FIELDS */}
                <div className="FormRow">
                  <div className="InputGroup">
                    <label>Age</label>
                    <input type="number" placeholder="Age" onChange={(e)=>setFormData({...formData, age: e.target.value})} />
                  </div>
                  <div className="InputGroup">
                    <label>Location</label>
                    <input type="text" placeholder="Location" onChange={(e)=>setFormData({...formData, location: e.target.value})} />
                  </div>
                </div>

                <div className="HealthDetailSection">
                  <div className="InputGroup">
                    <label>Select Health Issue</label>
                    <select className="CustomSelect" onChange={(e) => setSelectedIssue(e.target.value)}>
                      <option value="">Select an issue</option>
                      <option value="backpain">Back Pain</option>
                      <option value="asthma">Asthma</option>
                      <option value="diabetes">Diabetes</option>
                      <option value="others">Others</option>
                    </select>
                  </div>

                  <div className="FormRow">
                    <div className="InputGroup">
                      <label>Height (cm)</label>
                      <input type="number" placeholder="Height" onChange={(e)=>setFormData({...formData, height: e.target.value})} />
                    </div>
                    <div className="InputGroup">
                      <label>Weight (kg)</label>
                      <input type="number" placeholder="Weight" onChange={(e)=>setFormData({...formData, weight: e.target.value})} />
                    </div>
                  </div>

                  {selectedIssue === "others" && (
                    <div className="InputGroup animFade">
                      <label>Please specify</label>
                      <input type="text" placeholder="Type your health issue" onChange={(e)=>setFormData({...formData, otherIssue: e.target.value})} />
                    </div>
                  )}
                </div>

                <button type="submit" className="LoginBtn">Sign Up</button>
                <button type="button" className="BackBtn" onClick={() => setStep(1)}>Back to Details</button>
              </>
            )}
          </form>

          <div className="OrText"><span>OR</span></div>
          <div className="SocialLogin">
            <button className="SocialBtn">
              <Image src={LoginGoogle} alt="Google" width={20} height={20} />
              <span>Continue with Google</span>
            </button>
          </div>

          <p className="SignUpTxt">
            Already have an account? <Link href="/auth/login" className="SignupLink">Log In</Link>
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

export default Signup;