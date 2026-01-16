import React, { useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Settings = () => {
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    toast.success("Password updated successfully!");
    setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
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
              value={passwords.oldPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, oldPassword: e.target.value })
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
              value={passwords.newPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, newPassword: e.target.value })
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
              value={passwords.confirmPassword}
              onChange={(e) =>
                setPasswords({
                  ...passwords,
                  confirmPassword: e.target.value,
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
