import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MdCameraAlt } from "react-icons/md";
import { toast, Toaster } from "react-hot-toast";
import UserProfileImg from "@/assets/images/user-img.jpg";
import useProfile from "@/hooks/useProfile";
import { MEDIA_BASE_URL } from "@/utils/constants";

const EditProfile = ({ profileImg, setProfileImg, user }) => {
  const [imgError, setImgError] = useState("");
  const fileInputRef = useRef(null);
  const { updateProfile } = useProfile();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    location: "",
    age: "",
    hasHealthIssues: false,
    health_issue: "",
    height: "",
    weight: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        whatsapp: user.whatsapp || "",
        location: user.location || "",
        age: user.age || "",
        hasHealthIssues: !!user.health_issue, 
        health_issue: user.health_issue || "",
        height: user.height || "",
        weight: user.weight || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) newErrors.name = "Full Name is required";
    
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "Mobile Number is required";
    } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Invalid Mobile Number";
    }

    if (formData.age && (isNaN(formData.age) || formData.age < 0 || formData.age > 120)) {
        newErrors.age = "Please enter a valid age";
    }

    if (formData.hasHealthIssues) {
      if (!formData.health_issue || formData.health_issue === "Select an Issue") {
        newErrors.health_issue = "Please select a health issue";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [selectedFile, setSelectedFile] = useState(null);

  // ... (existing code)

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

      setSelectedFile(file); // Store the actual file
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
    if (!validateForm()) {
      toast.error("Please fix the errors");
      return;
    }
    
    const formDataObj = new FormData();
    Object.keys(formData).forEach(key => {
        formDataObj.append(key, formData[key]);
    });

    if (selectedFile) {
        formDataObj.append('avatar', selectedFile);
    } else if (profileImg) {
         formDataObj.append('avatar', profileImg);
    }

    // append _method PUT to trick some frameworks if needed, or just standard PUT
    formDataObj.append('_method', 'PUT'); 

    updateProfile.mutate(
      { id: user?.id, data: formDataObj },
      {
        onSuccess: () => {
           
        },
        onError: (error) => {
          console.log(error);
          toast.error(error?.data?.message);
        }
      }
    );
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
              src={profileImg}
              alt="Profile"
              width={60}
              height={60}
              onError={() => setProfileImg(MEDIA_BASE_URL + profileImg)}
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
            <label>Full Name <span style={{color:'red'}}>*</span></label>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "error-border" : ""}
            />
            {errors.name && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.name}</span>}
          </div>
          <div className="InputGroup">
            <label>Email <span style={{color:'red'}}>*</span></label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error-border" : ""}
            />
            {errors.email && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.email}</span>}
          </div>
          <div className="InputGroup">
            <label>Mobile Number <span style={{color:'red'}}>*</span></label>
            <input
              type="text"
              name="phone"
              placeholder="Mobile"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? "error-border" : ""}
            />
            {errors.phone && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.phone}</span>}
          </div>
          <div className="InputGroup">
            <label>WhatsApp Number</label>
            <input
              type="text"
              name="whatsapp"
              placeholder="WhatsApp"
              value={formData.whatsapp}
              onChange={handleChange}
            />
          </div>
          <div className="InputGroup">
            <label>Location</label>
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>
          <div className="InputGroup">
            <label>Age</label>
            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={handleChange}
               className={errors.age ? "error-border" : ""}
            />
             {errors.age && <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.age}</span>}
          </div>
        </div>

        {/* Health Issues Section */}
        <div className="HealthSection">
          <label className="CheckboxLabel">
            <input
              type="checkbox"
              name="hasHealthIssues"
              checked={formData.hasHealthIssues}
              onChange={handleChange}
            />
            Do you have any health issues?
          </label>

          {formData.hasHealthIssues && (
            <div className="HealthFieldsContainer">
              <div className="InputGroup">
                <label>Select Health Issue <span style={{color:'red'}}>*</span></label>
                <select
                  name="health_issue"
                  value={formData.health_issue}
                  onChange={handleChange}
                  className={errors.health_issue ? "error-border" : ""}
                >
                  <option value="">Select an Issue</option>
                  <option value="Back Pain">Back Pain</option>
                  <option value="Asthma">Asthma</option>
                  <option value="Other">Other</option>
                </select>
                {errors.health_issue && (
                  <span className="error-text" style={{color: 'red', fontSize: '12px'}}>{errors.health_issue}</span>
                )}
              </div>
              <div className="InputGroup">
                <label>Height (cm)</label>
                <input
                  type="text"
                  name="height"
                  placeholder="Height"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>
              <div className="InputGroup">
                <label>Weight (kg)</label>
                <input
                  type="text"
                  name="weight"
                  placeholder="Weight"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
        </div>

        <div className="FormActions">
          <button type="button" className="CancelBtn">
            Cancel
          </button>
          <button type="submit" className="SaveBtn">
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
