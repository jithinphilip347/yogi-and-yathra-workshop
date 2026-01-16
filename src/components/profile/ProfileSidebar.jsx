import React from "react";
import Image from "next/image";
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
import UserProfileImg from "@/assets/images/user-img.jpg";
import { MEDIA_BASE_URL } from "@/utils/constants";
import { useDispatch } from "react-redux";
import useProfile from "@/hooks/useProfile";

const ProfileSidebar = ({ activeTab, setActiveTab, profileImg, user, setProfileImg }) => {
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

  const { handleLogout } = useProfile();

  return (
    <div className="ProfileMainLeftNav">
      <div className="LeftsideNavTop">
        <div className="UserProfileBox">
          <div className="UserProfileImgBox">
            <Image
              src={profileImg}
              alt="User"  
              width={60}
              height={60}
              onError={() => setProfileImg(MEDIA_BASE_URL + profileImg)}
            />
          </div>
          <div className="UserInfo">
            <h4>{user.name}</h4>
            <p>{user.email}</p>
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
                  ? handleLogout()
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
  );
};

export default ProfileSidebar;
