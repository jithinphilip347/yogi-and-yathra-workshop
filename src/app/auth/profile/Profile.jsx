"use client";

import React, { useState , useRef } from "react";
import Image from "next/image";
import { MdCameraAlt } from "react-icons/md";
import { toast, Toaster } from "react-hot-toast"; 
import UserProfileImg from "../../../assets/images/user-img.jpg";
import CourseImg1 from "../../../assets/images/courseImg-1.jpg";
import CourseImg2 from "../../../assets/images/courseImg-2.jpg";
import CourseImg3 from "../../../assets/images/courseImg-3.jpg";

import User1 from "../../../assets/images/instructor-1.jpg";
import User2 from "../../../assets/images/instructor-2.jpg";
import User3 from "../../../assets/images/instructor-3.jpg";

import { FiUsers } from "react-icons/fi";
import { AiFillStar } from "react-icons/ai";
import { FiClock, FiBookOpen } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import {
  MdDashboard,
  MdEditNote,
  MdMenuBook,
  MdVideoCameraFront,
  MdEvent,
  MdSettings,
  MdHelpCenter,
  MdLogout,
} from "react-icons/md";
import CourseCard from "@/components/coursebox/CourseCard";

const courses = [
  {
    image: CourseImg1,
    wishlistIcon: <FaHeart />,
    lessonsIcon: <FiBookOpen />,
    clockIcon: <FiClock />,
    priceIcon: "₹",
    oldPriceIcon: "₹",
    lessonsLabel: "Lessons",
    ratingIcon: <AiFillStar />,
    userIcon: <FiUsers />,
    buttonText: "Enrolled",
    instructorLabel: "Instructor",
    title: "Mindful Meditation for Beginners",
    lessons: "25",
    duration: "20 hrs",
    price: "499",
    oldPrice: "899",
    rating: "4.9",
    students: "780",
    instructorImg: User3,
    instructorName: "Maya Krishna",
  },
  {
    image: CourseImg2,
    wishlistIcon: <FaHeart />,
    lessonsIcon: <FiBookOpen />,
    clockIcon: <FiClock />,
    priceIcon: "₹",
    oldPriceIcon: "₹",
    lessonsLabel: "Lessons",
    ratingIcon: <AiFillStar />,
    userIcon: <FiUsers />,
    buttonText: "Enrolled",
    instructorLabel: "Instructor",

    title: "Full-Body Yoga Masterclass",
    lessons: "35",
    duration: "45 hrs",
    price: "899",
    oldPrice: "1299",
    rating: "4.8",
    students: "1260",
    instructorImg: User2,
    instructorName: "Anil Dev",
  },
  {
    image: CourseImg3,
    wishlistIcon: <FaHeart />,
    lessonsIcon: <FiBookOpen />,
    clockIcon: <FiClock />,
    priceIcon: "₹",
    oldPriceIcon: "₹",
    lessonsLabel: "Lessons",
    ratingIcon: <AiFillStar />,
    userIcon: <FiUsers />,
    buttonText: "Enrolled",
    instructorLabel: "Instructor",

    title: "Breathwork Healingy",
    lessons: "18",
    duration: "16 hrs",
    price: "699",
    oldPrice: "999",
    rating: "4.7",
    students: "640",
    instructorImg: User1,
    instructorName: "Akhil ",
  },
];

const continueCourses = [
  {
    image: CourseImg1,
    title: "Mindful Meditation for Beginners",
    instructorImg: User3,
    instructorName: "Maya Krishna",
    progress: 65,
  },
  {
    image: CourseImg2,
    title: "Full-Body Yoga Masterclass",
    instructorImg: User2,
    instructorName: "Anil Dev",
    progress: 40,
  },
];

const upcomingEvents = [
  {
    date: "Feb 15, 2026",
    time: "7:00am - 8:30am",
    type: "Live Session",
    title: "Sunrise Vinyasa Flow: Awakening the Spirit",
    buttonText: "Join Now",
  },
  {
    date: "Feb 22, 2026",
    time: "6:00pm - 7:30pm",
    type: "Workshop",
    title: "Deep Sleep Meditation & Yoga Nidra Workshop",
    buttonText: "Book Spot",
  },
  {
    date: "Mar 05, 2026",
    time: "10:00am - 12:00pm",
    type: "Announcement",
    title: "New Course Release: Ayurvedic Nutrition Fundamentals",
    buttonText: "View Details",
  },
  {
    date: "Mar 12, 2026",
    time: "9:00am - 10:30am",
    type: "Community Event",
    title: "International Yoga Day Preparation Meeting",
    buttonText: "RSVP",
  },
];

const Profile = () => {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [profileImg, setProfileImg] = useState(UserProfileImg);
  const [imgError, setImgError] = useState("");
  const [hasHealthIssues, setHasHealthIssues] = useState(false);
  const fileInputRef = useRef(null);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Form State
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <div className="DashBoard">
            <div className="EnrolldCourseBox">
              <div className="DashBoardHead">
                <h2>Purchased Courses</h2>
                <p>Manage and continue your learning journey.</p>
              </div>

              <div className="CourseGrid">
                {courses.map((course, i) => (
                  <div className="CourseItem" key={i}>
                    <CourseCard {...course} />
                  </div>
                ))}
              </div>
            </div>
            <div className="ContinueWatchBox">
              <div className="DashBoardHead">
                <h2>Continue Watching</h2>
                <p>Pick up right where you left off.</p>
              </div>
              <div className="ContinueGrid">
                {continueCourses.map((item, index) => (
                  <div className="ContinueCard" key={index}>
                    <div className="Thumb">
                      <Image src={item.image} alt={item.title} />
                    </div>
                    <div className="Details">
                      <h4>{item.title}</h4>

                      {/* Progress Bar Area */}
                      <div className="ProgressContainer">
                        <div className="Bar">
                          <div
                            className="Fill"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <p>{item.progress}% Complete</p>
                      </div>

                      <div className="CardFooter">
                        <div className="Instructor">
                          <Image
                            src={item.instructorImg}
                            alt={item.instructorName}
                            width={30}
                            height={30}
                          />
                          <span>{item.instructorName}</span>
                        </div>
                        <button className="ContinueBtn">Continue</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="UpcomingEventsBox">
              <div className="DashBoardHead">
                <h2>Upcoming Events</h2>
                <p>
                  Don&apos;t miss out on these upcoming sessions and
                  announcements.
                </p>
              </div>
              <div className="EventsList">
                {upcomingEvents.map((event, index) => (
                  <div className="EventItem" key={index}>
                    <div className="EventDate">
                      <span className="FullDate">{event.date}</span>
                      <span className="Time">{event.time}</span>
                    </div>
                    <div className="EventContent">
                      <span className="EventType">{event.type}</span>
                      <h4 className="EventTitle">{event.title}</h4>
                    </div>
                    <div className="EventAction">
                      <button className="EventBtn">{event.buttonText}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "Edit Profile":
        return (
           <div className="EditProfile">
            <Toaster position="top-right" />
            <form onSubmit={handleSaveChanges}>
              <div className="PhotoUploadSection">
                <div 
                  className="BigProfileImg" 
                  onClick={() => fileInputRef.current.click()}
                >
                  <Image src={profileImg} alt="Profile" width={60} height={60} />
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
                <button type="button" className="CancelBtn">Cancel</button>
                <button type="submit" className="SaveBtn">Save Changes</button>
              </div>
            </form>
          </div>
        );
      case "My Courses":
        return (
         <div className="MyCourseBox">
              <div className="DashBoardHead">
                <h2>Purchased Courses</h2>
                <p>Manage and continue your learning journey.</p>
              </div>

              <div className="CourseGrid">
                {courses.map((course, i) => (
                  <div className="CourseItem" key={i}>
                    <CourseCard {...course} />
                  </div>
                ))}
              </div>
            </div>
        );
      case "Live Classes":
        return (
          <div>
            <h2>Live Classes</h2>
            <p>No live classes scheduled for today.</p>
          </div>
        );
      case "Events":
        return (
       <div className="UpcomingEventsBox">
              <div className="DashBoardHead">
                <h2>Upcoming Events</h2>
                <p>
                  Don&apos;t miss out on these upcoming sessions and
                  announcements.
                </p>
              </div>
              <div className="EventsList">
                {upcomingEvents.map((event, index) => (
                  <div className="EventItem" key={index}>
                    <div className="EventDate">
                      <span className="FullDate">{event.date}</span>
                      <span className="Time">{event.time}</span>
                    </div>
                    <div className="EventContent">
                      <span className="EventType">{event.type}</span>
                      <h4 className="EventTitle">{event.title}</h4>
                    </div>
                    <div className="EventAction">
                      <button className="EventBtn">{event.buttonText}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        );
      case "Settings":
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
                    onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})}
                    required 
                  />
                  <span className="EyeIcon" onClick={() => setShowOldPass(!showOldPass)}>
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
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    required 
                  />
                  <span className="EyeIcon" onClick={() => setShowNewPass(!showNewPass)}>
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
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    required 
                  />
                  <span className="EyeIcon" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                    {showConfirmPass ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              <button type="submit" className="UpdatePassBtn">Update Password</button>
            </form>
          </div>
        );
      case "Help & Support":
        return (
          <div>
            <h2>Help & Support</h2>
            <p>How can we help you today?</p>
          </div>
        );
      default:
        return <div>Select an option from the menu</div>;
    }
  };

  // Updated arrays with Material Icons
  const navItems = [
    { name: "Dashboard", icon: <MdDashboard /> },
    { name: "Edit Profile", icon: <MdEditNote /> },
    { name: "My Courses", icon: <MdMenuBook /> },
    { name: "Live Classes", icon: <MdVideoCameraFront /> },
    { name: "Events", icon: <MdEvent /> },
  ];

  const bottomNavItems = [
    { name: "Settings", icon: <MdSettings /> },
    { name: "Help & Support", icon: <MdHelpCenter /> },
    { name: "Logout", icon: <MdLogout /> },
  ];

  return (
    <div id="Profile">
      <div className="container">
        <div className="ProfileMain">
          <div className="ProfileMainLeftNav">
            <div className="LeftsideNavTop">
              <div className="UserProfileBox">
                <div className="UserProfileImgBox">
                  <Image
                    src={profileImg}
                    alt="User"
                    width={60}
                    height={60}
                  />
                </div>
                <div className="UserInfo">
                  <h4>Achu Sivadasan</h4>
                  <p>Daily learner</p>
                </div>
              </div>

              <div className="LeftsideNavItem">
                <div className="MenuHeader">
                  <p>MENU</p>
                </div>
                <ul>
                  {navItems.map((item) => (
                    <li
                      key={item.name}
                      className={activeTab === item.name ? "active" : ""}
                      onClick={() => setActiveTab(item.name)}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="LeftsideNavBottom">
              <ul>
                {bottomNavItems.map((item) => (
                  <li
                    key={item.name}
                    className={activeTab === item.name ? "active" : ""}
                    onClick={() =>
                      item.name === "Logout"
                        ? alert("Logging out...")
                        : setActiveTab(item.name)
                    }
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="ProfileMainRight">
            <div className="ContentCard">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
