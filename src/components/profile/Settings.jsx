import useProfile from "@/hooks/useProfile";
import React, { useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Settings = () => {
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const { changePassword } = useProfile();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.new_password_confirmation) {
      toast.error("New passwords do not match!");
      return;
    }
    if (passwords.new_password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      await changePassword(passwords);
      
      setPasswords({ current_password: "", new_password: "", new_password_confirmation: "" });
    } catch (error) {
      toast.error("Failed to update password");
    }
  };

  return (
    <div className="SettingsSection">
      <Toaster position="top-right" />
      <div className="DashBoardHead">
        <h2>Account Settings</h2>
        <p>Update your password to keep your account secure.</p>
      </div>

      <form className="PasswordForm" onSubmit={handlePasswordChange}>
        <div className="InputGroup">
          <label>Old Password</label>
          <div className="PassInputWrapper">
            <input
              type={showOldPass ? "text" : "password"}
              placeholder="Enter old password"
              value={passwords.current_password}
              onChange={(e) =>
                setPasswords({ ...passwords, current_password: e.target.value })
              }
              required
            />
            <span
              className="EyeIcon"
              onClick={() => setShowOldPass(!showOldPass)}
            >
              {showOldPass ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        <div className="InputGroup">
          <label>New Password</label>
          <div className="PassInputWrapper">
            <input
              type={showNewPass ? "text" : "password"}
              placeholder="Enter new password"
              value={passwords.new_password}
              onChange={(e) =>
                setPasswords({ ...passwords, new_password: e.target.value })
              }
              required
            />
            <span
              className="EyeIcon"
              onClick={() => setShowNewPass(!showNewPass)}
            >
              {showNewPass ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        <div className="InputGroup">
          <label>Confirm New Password</label>
          <div className="PassInputWrapper">
            <input
              type={showConfirmPass ? "text" : "password"}
              placeholder="Confirm new password"
              value={passwords.new_password_confirmation}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  new_password_confirmation: e.target.value,
                })
              }
              required
            />
            <span
              className="EyeIcon"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
            >
              {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        <button type="submit" className="UpdatePassBtn">
          Update Password
        </button>
      </form>
    </div>
  );
};

export default Settings;
