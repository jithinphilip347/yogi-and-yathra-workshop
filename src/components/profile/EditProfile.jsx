import React, { useState, useRef } from "react";
import Image from "next/image";
import { MdCameraAlt } from "react-icons/md";
import { toast, Toaster } from "react-hot-toast";
import UserProfileImg from "@/assets/images/user-img.jpg";

const EditProfile = ({ profileImg, setProfileImg }) => {
  const [imgError, setImgError] = useState("");
  const [hasHealthIssues, setHasHealthIssues] = useState(false);
  const fileInputRef = useRef(null);
  

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImgError("");

    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!validTypes.includes(file.type)) {
        setImgError("Only JPG, PNG, or WebP files are allowed.");
        return;
      }
      if (file.size > maxSize) {
        setImgError("File size must be less than 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImg(reader.result);
        toast.success("Photo uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    toast.success("Profile changed successfully!");
  };

  return (
    <div className="EditProfile">
      <Toaster position="top-right" />
      <form onSubmit={handleSaveChanges}>
        <div className="PhotoUploadSection">
          <div
            className="BigProfileImg"
            onClick={() => fileInputRef.current.click()}
          >
            <Image
              src={profileImg || UserProfileImg}
              alt="Profile"
              width={60}
              height={60}
            />
            <div className="Overlay">
              <MdCameraAlt />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/*"
            onChange={handleImageChange}
          />
          <div className="UploadInfo">
            <p className="hint">Max size 2MB. JPG, PNG, WebP only.</p>
            {imgError && <p className="error-text">{imgError}</p>}
          </div>
        </div>

        {/* Form Fields from Image */}
        <div className="FormGrid">
          <div className="InputGroup">
            <label>Full Name</label>
            <input type="text" placeholder="Name" required />
          </div>
          <div className="InputGroup">
            <label>Email</label>
            <input type="email" placeholder="Email" required />
          </div>
          <div className="InputGroup">
            <label>Mobile Number</label>
            <input type="text" placeholder="Mobile" required />
          </div>
          <div className="InputGroup">
            <label>WhatsApp Number</label>
            <input type="text" placeholder="WhatsApp" />
          </div>
          <div className="InputGroup">
            <label>Location</label>
            <input type="text" placeholder="Location" />
          </div>
          <div className="InputGroup">
            <label>Age</label>
            <input type="number" placeholder="Age" />
          </div>
        </div>

        {/* Health Issues Section */}
        <div className="HealthSection">
          <label className="CheckboxLabel">
            <input
              type="checkbox"
              checked={hasHealthIssues}
              onChange={(e) => setHasHealthIssues(e.target.checked)}
            />
            Do you have any health issues?
          </label>

          {hasHealthIssues && (
            <div className="HealthFieldsContainer">
              <div className="InputGroup">
                <label>Select Health Issue</label>
                <select>
                  <option>Select an Issue</option>
                  <option>Back Pain</option>
                  <option>Asthma</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="InputGroup">
                <label>Height (cm)</label>
                <input type="text" placeholder="Height" />
              </div>
              <div className="InputGroup">
                <label>Weight (kg)</label>
                <input type="text" placeholder="Weight" />
              </div>
            </div>
          )}
        </div>

        <div className="FormActions">
          <button type="button" className="CancelBtn">
            Cancel
          </button>
          <button type="submit" className="SaveBtn">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
