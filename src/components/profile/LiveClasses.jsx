import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  FiMoreVertical, 
  FiCalendar, 
  FiClock, 
  FiPlayCircle,
  FiFileText,
  FiInfo,
  FiXCircle
} from "react-icons/fi";
import ThumbNail from "@/assets/images/live1.webp"; 

const MOCK_CLASSES = [
  {
    id: 14, // Changed ID to 14 to match the requested route example
    title: "Advanced Meditation",
    category: "POWER YOGA",
    instructor: "Achu Sivadasan",
    dateRange: "14 Jan - 24 Jan",
    time: "07:00 PM",
    days: ["Tuesday", "Wednesday"],
    progress: {
      currentDay: 4,
      totalDays: 10,
      percentage: 40
    },
    todayStatus: {
      hasSession: true,
      isLive: false,
      isCompleted: false,
      message: "Starts in 01:22:10",
      helper: "Join opens 15 mins before",
      actionText: "Join Today's Class",
      actionType: "primary"
    },
    status: "active"
  },
  {
    id: 3,
    title: "Mindfulness Retreat",
    category: "MEDITATION",
    instructor: "Achu Sivadasan",
    dateRange: "01 Dec - 10 Dec",
    time: "08:00 PM",
    days: ["Saturday", "Sunday"],
    progress: {
      currentDay: 10,
      totalDays: 10,
      percentage: 100
    },
    todayStatus: {
      hasSession: false,
      isLive: false,
      isCompleted: true,
      message: "Course Finished",
      actionText: "Download Certificate",
      actionType: "success"
    },
    status: "completed"
  },
  {
    id: 4,
    title: "Yoga for Beginners",
    category: "HATHA YOGA",
    instructor: "Achu Sivadasan",
    dateRange: "10 Mar - 20 Mar",
    time: "05:00 PM",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    progress: {
      currentDay: 4,
      totalDays: 10,
      percentage: 40
    },
    todayStatus: {
      hasSession: false,
      isLive: false,
      isCompleted: false,
      message: "Refund: ₹350 Processed",
      actionText: "Enrollment Cancelled",
      actionType: "disabled"
    },
    status: "cancelled"
  }
];

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const LiveClasses = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("active");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const dropdownRef = useRef(null);

  const filteredClasses = MOCK_CLASSES.filter(c => c.status === activeTab);

  const toggleDropdown = (id) => {
    setDropdownOpen(dropdownOpen === id ? null : id);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleViewDetails = (id) => {
    router.push(`/daily-class/${id}/live-class`);
  };

  const handleActionBtnClick = (course) => {
    if (course.todayStatus.actionType === "primary" || course.todayStatus.actionType === "secondary") {
      router.push("/live-stream");
    }
  };

  return (
    <div className="LiveClasses">
      {/* 1. Tabs Navigation */}
      <div className="TabsNav">
        <button 
          className={`TabBtn ${activeTab === "active" ? "Active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Current Classes ({MOCK_CLASSES.filter(c => c.status === "active").length})
        </button>
        <button 
          className={`TabBtn ${activeTab === "completed" ? "Active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({MOCK_CLASSES.filter(c => c.status === "completed").length})
        </button>
        <button 
          className={`TabBtn ${activeTab === "cancelled" ? "Active" : ""}`}
          onClick={() => setActiveTab("cancelled")}
        >
          Cancelled ({MOCK_CLASSES.filter(c => c.status === "cancelled").length})
        </button>
      </div>

      {/* 2. Class List */}
      <div className="ClassList">
        {filteredClasses.length === 0 ? (
          <div className="EmptyState">
            <div className="EmptyIconWrapper">
              <FiInfo className="EmptyIcon" />
            </div>
            <h3>No Live Classes Found</h3>
            <p>You haven&apos;t enrolled in any classes for this category yet. Explore our courses to start your journey!</p>
          </div>
        ) : (
          filteredClasses.map(course => (
            <div className={`ProgramCard ${course.status}`} key={course.id}>
              
              {/* Badge for Active Courses */}
              {course.status === "active" && (
                <div className="ActiveBadge">ACTIVE</div>
              )}

              {/* More Options Dropdown */}
              <div className="MoreOptions" ref={dropdownRef}>
                <button className="MoreBtn" onClick={() => toggleDropdown(course.id)}>
                  <FiMoreVertical />
                </button>
                {dropdownOpen === course.id && (
                  <div className="DropdownMenu">
                    <button onClick={() => handleViewDetails(course.id)}>View Details</button>
                    <button>View Schedule</button>
                    <button>Download Invoice</button>
                    <button>Need Help</button>
                    {course.status === "active" && (
                      <button className="CancelBtn">Cancel Enrollment</button>
                    )}
                  </div>
                )}
              </div>

              {/* Left Column: Details */}
              <div className="CardLeft">
                <div className="Header">
                  <div className="Thumb">
                    <Image src={ThumbNail} alt={course.title} width={100} height={70} className="Img" />
                    <span className="Category">{course.category}</span>
                  </div>
                  <div className="TitleInfo">
                    <h3>{course.title}</h3>
                    <p className="Instructor">Instructor: <span>{course.instructor}</span></p>
                  </div>
                </div>

                <div className="ScheduleMeta">
                  <div className="MetaItem">
                    <FiCalendar className="Icon" />
                    <span>{course.dateRange}</span>
                  </div>
                  <div className="MetaItem">
                    <FiClock className="Icon" />
                    <span>{course.time}</span>
                  </div>
                </div>

                <div className="WeeklyChips">
                  {FULL_DAYS.map((fullDay, idx) => {
                    const isActive = course.days.includes(fullDay);
                    return (
                      <span key={idx} className={`Chip ${isActive ? 'Active' : ''}`}>
                        {WEEK_DAYS[idx]}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Progress & Action */}
              <div className="CardRight">
                <div className="ProgressHero">
                  <div className="ProgressHeader">
                    <span className="Label">PROGRESS</span>
                    <span className="Value">Day {course.progress.currentDay} / {course.progress.totalDays}</span>
                  </div>
                  <div className="ProgressBar">
                    <div className="Fill" style={{ width: `${course.progress.percentage}%` }}></div>
                  </div>
                </div>

                <div className="TodayStatusBox">
                  <div className="StatusHeader">
                    {course.todayStatus.hasSession ? (
                      <span className="Title">Today&apos;s Class</span>
                    ) : (
                      <span className="Title">
                        {course.status === "cancelled" ? "Cancelled" : course.todayStatus.isCompleted ? "Course Completed" : "No Live Class Today"}
                      </span>
                    )}
                  </div>
                  <div className="StatusMessage">
                    {course.todayStatus.message}
                  </div>
                  {course.todayStatus.helper && (
                    <div className="HelperText">{course.todayStatus.helper}</div>
                  )}
                </div>

                <button 
                  className={`ActionBtn ${course.todayStatus.actionType}`}
                  disabled={course.todayStatus.actionType === "disabled"}
                  onClick={() => handleActionBtnClick(course)}
                >
                  {course.todayStatus.actionType === "primary" && <FiPlayCircle className="BtnIcon" />}
                  {course.todayStatus.actionType === "success" && <FiFileText className="BtnIcon" />}
                  {course.todayStatus.actionType === "disabled" && <FiXCircle className="BtnIcon" />}
                  {course.todayStatus.actionText}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveClasses;
