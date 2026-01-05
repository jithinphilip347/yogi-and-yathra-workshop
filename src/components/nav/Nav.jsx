"use client";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import UserImg from "../../assets/images/user.jpg";
import Logo from "../../assets/images/logo.png";
import courseImg1 from "../../assets/images/courseImg-1.jpg";
import { BiSearch, BiTimeFive } from "react-icons/bi";
import { VscMenu } from "react-icons/vsc";
import Sidnav from "./Sidnav"; 

import {
  MdOutlineShoppingBag,
  MdFavoriteBorder,
  MdKeyboardArrowDown,
  MdPerson,
  MdNotifications,
  MdLogout,
  MdStar,
  MdPlayCircleOutline,
  MdOutlineFileDownload,
  MdMenu,
} from "react-icons/md";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoMdNotificationsOutline } from "react-icons/io";
import { RiLoginCircleLine, RiUserLine } from "react-icons/ri";
import { IoPeopleOutline, IoCartOutline } from "react-icons/io5";
import NavSearchOverlay from "./NavSearchOverlay";

const Nav = () => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);
  const path = usePathname();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Outside Click Close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setOpenNotification(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target))
        setIsSearching(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
    <nav id="Nav">
      <div className="container">
        <div className="NavMain">
          <div className="LogoBox">
          <div className="ToogleMenuBox" onClick={() => setIsSideNavOpen(true)}>
                <VscMenu />
              </div>
          <Link href="/" className="NavLogo">
            <Image src={Logo} alt="Logo" className="logoImg" />
          </Link>
          </div>
       

          {/* <div className="NavLinks">
            <ul>
              <li>
                <Link href="/" className={path === "/" ? "active" : ""}>Home</Link>
              </li>
              <li>
                <Link href="/course" className={path === "/course" ? "active" : ""}>Course</Link>
              </li>
            </ul>
          </div> */}
          <div className="NavSearchContainer" ref={searchRef}>
            <div className={`SearchWrapper ${isSearching ? "focused" : ""}`}>
              <BiSearch className="SearchIcon" />
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchQuery}
                onFocus={() => setIsSearching(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Search Dropdown */}
            {isSearching && (
              <div className="SearchDropdown">
                <div className="SuggestionSection">
                  <div className="SuggestItem">
                    <BiTimeFive /> <p>Yoga for Beginners</p>
                  </div>
                  <div className="SuggestItem">
                    <BiTimeFive /> <p>Advanced Meditation Techniques</p>
                  </div>
                </div>

                <div className="RecommendedSection">
                  <h4>Recommended Courses</h4>
                  <div className="CourseList">
                    {[1, 2].map((item) => (
                      <div className="SearchCourseBox" key={item}>
                        <div className="CourseImg">
                          <Image src={courseImg1} alt="course" />
                        </div>
                        <div className="CourseDetails">
                          <h5>Mastering Hatha Yoga</h5>
                          <div className="CourseMeta">
                            <span>
                              <MdStar className="star" /> 4.8
                            </span>
                            <span>
                              <MdPlayCircleOutline /> 12 Lessons
                            </span>
                            <span>
                              <IoPeopleOutline /> 1.2k
                            </span>
                            <span>
                              <MdOutlineFileDownload /> 240
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="NavRightBox">
            <div className="searchCartWishlistBox">
              <div className="SearchIconTrigger" onClick={() => setIsSearchOpen(true)}>
                  <BiSearch />
                </div>

              <Link href="/cart" className="CartIcon">
                <IoCartOutline />
              </Link>

              <Link href="/wishlist" className="WishlistIcon">
                <MdFavoriteBorder />
              </Link>

              <div
                className="NavIcon NotificationIcon"
                ref={notificationRef}
                onClick={() => {
                  setOpenNotification(!openNotification);
                  setOpenDropdown(false);
                }}
              >
                <IoMdNotificationsOutline />
                <span className="notifBadge"></span>

                {openNotification && (
                  <div className="NotificationDropdown">
                    <p className="notifItem">New course added </p>
                    <p className="notifItem">50% Off on Yoga Course </p>
                    <p className="notifItem">New updates available</p>
                    <Link href="/notifications" className="viewAll">
                      View All
                    </Link>
                  </div>
                )}
              </div>
            </div>
           <div className="AuthBox">
            <div className="LoginBox">
              <Link href="/login" className="authLink">
                <RiLoginCircleLine />
                <button>Login</button>
              </Link>
            </div>
            <div className="SignBox">
              <Link href="/signup" className="authLink">
                <RiUserLine />
                <button>Sign Up</button>
              </Link>
            </div>
          </div>
            {/* <div className="UserProfileBox"
              ref={dropdownRef}
              onClick={() => {
                setOpenDropdown(!openDropdown);
                setOpenNotification(false);
              }}
            >
              <div className="ProfileImageBox">
                <Image src={UserImg} alt="User" className="UserImage" />
              </div>

              <div className="UserNameDropIconBox">
                <div className="UserNameBox">
                  <p className="UserWelcome">Hi Welcome</p>
                  <p className="UserName">Achu Sivadasan</p>
                </div>
                <MdKeyboardArrowDown className="DropIcon" />
              </div>

              {openDropdown && (
                <div className="UserDropdown">
                  <Link href="/profile" className="DropItem">
                    <MdPerson /> Profile
                  </Link>

                  <div className="DropItem borderBottom">
                    <MdNotifications /> Notifications
                  </div>

                  <div className="DropItem">
                    <MdLogout /> Logout
                  </div>
                </div>
              )}

            </div> */}
          </div>
        </div>
      </div>
    </nav>

    <NavSearchOverlay
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

    <Sidnav isOpen={isSideNavOpen} onClose={() => setIsSideNavOpen(false)} />
    </>
  );
};

export default Nav;
