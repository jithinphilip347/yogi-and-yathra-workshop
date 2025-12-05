"use client";
import Image from "next/image";
import React, { useState, useRef, useEffect } from "react";
import UserImg from "../../assets/images/user.jpg";
import Logo from "../../assets/images/logo.png";
import { BiSearch } from "react-icons/bi";
import {
  MdOutlineShoppingBag,
  MdFavoriteBorder,
  MdKeyboardArrowDown,
  MdPerson,
  MdNotifications,
  MdLogout
} from "react-icons/md";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoMdNotificationsOutline } from "react-icons/io";

const Nav = () => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const path = usePathname();

  // Outside Click Close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpenDropdown(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setOpenNotification(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav id="Nav">
      <div className="container">
        <div className="NavMain">

          <Link href="/" className="NavLogo">
            <Image src={Logo} alt="Logo" className="logoImg" />
          </Link>

          <div className="NavLinks">
            <ul>
              <li>
                <Link href="/" className={path === "/" ? "active" : ""}>Home</Link>
              </li>
              <li>
                <Link href="/course" className={path === "/course" ? "active" : ""}>Course</Link>
              </li>
            </ul>
          </div>

          <div className="NavRightBox">
            <div className="searchCartWishlistBox">

              <div className="NavIcon"><BiSearch /></div>

              <Link href="/cart" className="NavIcon">
                <MdOutlineShoppingBag />
              </Link>

              <Link href="/wishlist" className="NavIcon">
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
                <IoMdNotificationsOutline  />
                <span className="notifBadge"></span>

                {openNotification && (
                  <div className="NotificationDropdown">
                    <p className="notifItem">New course added </p>
                    <p className="notifItem">50% Off on Yoga Course </p>
                    <p className="notifItem">New updates available</p>
                    <Link href="/notifications" className="viewAll">View All</Link>
                  </div>
                )}
              </div>

            </div>
            <div className="UserProfileBox"
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

            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Nav;
