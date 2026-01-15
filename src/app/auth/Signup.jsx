"use client";
import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import LoginLogo from "../../assets/images/logo.png";
import LoginGoogle from "../../assets/images/google.png";
import Image from "next/image";
import Link from "next/link";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [hasHealthIssue, setHasHealthIssue] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState("");
  const [formData, setFormData] = useState({
    name: "", email: "", mobile: "", password: "", confirmPassword: "",
    whatsapp: "", location: "", age: "", height: "", weight: "", otherIssue: ""
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.mobile) newErrors.mobile = "Mobile is required";
    if (formData.password !== formData.confirmPassword) newErrors.confirm = "Passwords do not match";
    if (!formData.age) newErrors.age = "Age is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) console.log("Signup Data:", formData);
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

          <form className="LoginForm" onSubmit={handleSubmit}>
            <div className="FormRow">
              <div className="InputGroup">
                <label>Full Name</label>
                <input type="text" placeholder="Name" onChange={(e)=>setFormData({...formData, name: e.target.value})} />
                {errors.name && <span className="ErrorTxt">{errors.name}</span>}
              </div>
              <div className="InputGroup">
                <label>Email</label>
                <input type="email" placeholder="Email" onChange={(e)=>setFormData({...formData, email: e.target.value})} />
              </div>
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

            <div className="FormRow">
               <div className="InputGroup">
                <label>Password</label>
                <input type="password" placeholder="Password" onChange={(e)=>setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="InputGroup">
                <label>Confirm Password</label>
                <input type="password" placeholder="Confirm" onChange={(e)=>setFormData({...formData, confirmPassword: e.target.value})} />
                {errors.confirm && <span className="ErrorTxt">{errors.confirm}</span>}
              </div>
            </div>

            <div className="FormRow">
              <div className="InputGroup">
                <label>Location</label>
                <input type="text" placeholder="Location" onChange={(e)=>setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="InputGroup">
                <label>Age</label>
                <input type="number" placeholder="Age" onChange={(e)=>setFormData({...formData, age: e.target.value})} />
              </div>
            </div>

        

            <div className="CheckboxGroup">
              <input 
                type="checkbox" 
                id="healthIssue" 
                onChange={(e) => setHasHealthIssue(e.target.checked)} 
              />
              <label htmlFor="healthIssue">Do you have any health issues?</label>
            </div>

            {hasHealthIssue && (
              <div className="HealthDetailSection">
                <div className="InputGroup">
                  <label>Select Health Issue</label>
                  <select 
                    className="CustomSelect" 
                    onChange={(e) => setSelectedIssue(e.target.value)}
                  >
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
                <input type="number" placeholder="Height" />
              </div>
              <div className="InputGroup">
                <label>Weight (kg)</label>
                <input type="number" placeholder="Weight" />
              </div>
            </div>
                {selectedIssue === "others" && (
                  <div className="InputGroup animFade">
                    <label>Please specify</label>
                    <input 
                      type="text" 
                      placeholder="Type your health issue" 
                      onChange={(e)=>setFormData({...formData, otherIssue: e.target.value})}
                    />
                  </div>
                )}
              </div>
            )}

            <button type="submit" className="LoginBtn">Sign Up</button>
          </form>

          <div className="OrText"><span>OR</span></div>

             <div className="SocialLogin">
                      <button className="SocialBtn">
                        <Image src={LoginGoogle} alt="Google" width={20} height={20} />
                        <span>Continue with Google</span>
                      </button>
                    </div>

          <p className="SignUpTxt">
            Already have an account?{" "}
            <Link href="/auth/login" className="SignupLink">Log In</Link>
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