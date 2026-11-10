"use client";
import React, { useState, useEffect } from "react";
import UserImg from "../../assets/images/user.webp";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { fetchCategories } from "@/libs/course";
import {
  MdClose,
  MdKeyboardArrowDown,
  MdFavoriteBorder,
  MdOutlineInfo,
  MdOutlineContactSupport,
  MdFlight,
  MdOutlineShoppingBag,
  MdSelfImprovement,
} from "react-icons/md";
import { FiCalendar } from "react-icons/fi";
import { IoMdNotificationsOutline } from "react-icons/io";
import { IoCartOutline } from "react-icons/io5";
import { HiOutlineHome, HiOutlineBookOpen } from "react-icons/hi";
import { BiNews } from "react-icons/bi";
import Image from "next/image";

const Sidnav = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const [isCourseOpen, setIsCourseOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const isTravel = pathname?.startsWith("/travel");
  const isEvent = pathname?.startsWith("/event");
  const activeVertical = isTravel
    ? "travel"
    : isEvent
    ? "events"
    : "workshop";

  const verticalSwitchers = [
    {
      id: "workshop",
      name: "Workshop",
      path: "/",
      icon: MdSelfImprovement,
      isExternal: false,
    },
    {
      id: "ecommerce",
      name: "Spiritual Store",
      path: "https://www.yogiandyathra.com/",
      icon: MdOutlineShoppingBag,
      isExternal: true,
    },
    {
      id: "events",
      name: "Events",
      path: "/event",
      icon: FiCalendar,
      isExternal: false,
    },
    {
      id: "travel",
      name: "Travel",
      path: "/travel",
      icon: MdFlight,
      isExternal: false,
    },
  ];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    fetchCategories().then((res) => {
      setCategories(res || []);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={`SideNavOverlay ${isOpen ? "active" : ""}`}
        onClick={onClose}
      ></div>

      <div id="Sidnav" className={isOpen ? "open" : ""}>
        <div className="SideNavHeader">
          <div className="CloseIcon" onClick={onClose}>
            <MdClose />
          </div>
        </div>
        <div className="UserProfileBox">
          <div className="ProfileImageBox">
            <Image src={UserImg} alt="User" className="UserImage" />
          </div>

          <div className="UserNameDropIconBox">
            <div className="UserNameBox">
              <p className="UserWelcome">{isAuthenticated ? "Welcome back" : "Welcome"}</p>
              <p className="UserName">{isAuthenticated ? user?.name || "User" : "Guest"}</p>
            </div>
          </div>
        </div>

        {/* Mobile Platform Vertical Switcher */}
        <div className="SideNavSwitcherBox">
          <span className="sideSwitcherLabel">Platforms</span>
          <div className="sideSwitcherGrid">
            {verticalSwitchers.map((item) => {
              const Icon = item.icon;
              const isActive = activeVertical === item.id;
              if (item.isExternal) {
                return (
                  <a
                    key={item.id}
                    href={item.path}
                    onClick={onClose}
                    className={`sideSwitchBtn ${isActive ? "active" : ""}`}
                    title={`Go to ${item.name}`}
                  >
                    <Icon className={`sideIcon icon-${item.id}`} />
                    <span>{item.name}</span>
                  </a>
                );
              }
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={onClose}
                  className={`sideSwitchBtn ${isActive ? "active" : ""}`}
                  title={`Switch to ${item.name}`}
                >
                  <Icon className={`sideIcon icon-${item.id}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="SideNavLinks">
          <ul>
            {/* Home Link */}
            <li>
              <Link href="/" onClick={onClose}>
                <HiOutlineHome /> Home
              </Link>
            </li>

            {/* Courses Dropdown */}
            <li className="HasSub">
              <div
                className="SideNavLinkItem"
                onClick={() => setIsCourseOpen(!isCourseOpen)}
              >
                <div className="itemLeft">
                  <HiOutlineBookOpen /> Courses
                </div>
                <MdKeyboardArrowDown className={isCourseOpen ? "rotate" : ""} />
              </div>

              <ul className={`SideSubMenu ${isCourseOpen ? "show" : ""}`}>
                <li>
                  <Link href="/course" onClick={onClose}>
                    All Courses
                  </Link>
                </li>
                {categories.map((cat, i) => (
                  <li key={cat.id || i}>
                    <Link href={`/course?category=${cat.id || cat.slug}`} onClick={onClose}>
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* About Link */}
            <li>
              <Link href="/about" onClick={onClose}>
                <MdOutlineInfo /> About
              </Link>
            </li>

            {/* Blog Link */}
            <li>
              <Link href="/blog" onClick={onClose}>
                <BiNews /> Blog
              </Link>
            </li>

            {/* Contact Link */}
            <li>
              <Link href="/contact" onClick={onClose}>
                <MdOutlineContactSupport /> Contact
              </Link>
            </li>

            <div className="Divider"></div>

            {/* Shop Related Links */}
            <li>
              <Link href="/cart" onClick={onClose}>
                <IoCartOutline /> Cart
              </Link>
            </li>
            <li>
              <Link href="/wishlist" onClick={onClose}>
                <MdFavoriteBorder /> Wishlist
              </Link>
            </li>
            <li>
              <Link href="/notifications" onClick={onClose} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IoMdNotificationsOutline /> Notifications
                </div>
                {mounted && isAuthenticated && unreadCount > 0 && (
                  <span
                    style={{
                      background: "var(--primaryColor, #874429)",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      minWidth: "20px",
                      textAlign: "center",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Sidnav;
