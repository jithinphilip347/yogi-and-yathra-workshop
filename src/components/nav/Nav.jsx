"use client";
import Image from "next/image";
import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserImg from "../../assets/images/user.webp";
import Logo from "../../assets/images/logo.png";
import courseImg1 from "../../assets/images/courseImg-1.webp";
import { BiSearch, BiTimeFive } from "react-icons/bi";
import { VscMenu } from "react-icons/vsc";
import { FiAlertCircle, FiSearch, FiUser } from "react-icons/fi";
import { resolveMediaUrl } from "@/utils/mediaUrl";
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
import { IoMdNotificationsOutline } from "react-icons/io";
import { RiLoginCircleLine, RiUserLine } from "react-icons/ri";
import { IoPeopleOutline, IoCartOutline } from "react-icons/io5";
import NavSearchOverlay from "./NavSearchOverlay";
import { useSelector } from "react-redux";
import { selectCartItemCount } from "@/features/commerce/selectors/commerceSelectors";
import useProfile from "@/hooks/useProfile";
import useDebounce from "@/hooks/useDebounce";
import useGlobalSearch from "@/hooks/useGlobalSearch";
import { useUnreadNotificationCount, useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import useNotificationRealtime from "@/hooks/useNotificationRealtime";
import { useRouter } from "next/navigation";

import { getSearchResultRoute, getSearchResultTypeLabel } from "@/utils/searchNavigation";

const Nav = () => {
  const router = useRouter();
  const { handleLogout } = useProfile();
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
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const itemCount = useSelector(selectCartItemCount);

  // Activate WebSocket real-time subscription for in-app notifications
  useNotificationRealtime();

  // Real notification data
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: previewData, isLoading: isNotificationsLoading } = useNotifications({
    page: 1,
    per_page: 5,
  });
  const markReadMutation = useMarkNotificationRead();
  const previewNotifications = previewData?.data || [];

  const handlePreviewClick = (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    setOpenNotification(false);
    if (notif.action_url) {
      router.push(notif.action_url);
    }
  };

  const [mounted, setMounted] = useState(false);

  // Debounced search for inline dropdown
  const debouncedQuery = useDebounce(searchQuery, 350);
  const trimmedDebounced = debouncedQuery?.trim() ?? "";
  const {
    data: inlineData,
    isLoading: inlineLoading,
    isFetching: inlineFetching,
    isError: inlineError,
  } = useGlobalSearch(trimmedDebounced);

  const inlineResults = inlineData?.data || [];

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Determine inline dropdown state
  const isInlineIdle = !trimmedDebounced;
  const isInlineLoading = !isInlineIdle && (inlineLoading || inlineFetching);
  const isInlineEmpty =
    !isInlineIdle && !isInlineLoading && !inlineError && inlineResults.length === 0;
  const isInlineError = !isInlineIdle && !isInlineLoading && inlineError;
  const showInlineResults =
    !isInlineIdle && !isInlineLoading && !inlineError && inlineResults.length > 0;

  return (
    <>
      <nav id="Nav">
        <div className="container">
          <div className="NavMain">
            <div className="LogoBox">
              <div
                className="ToogleMenuBox"
                onClick={() => setIsSideNavOpen(true)}
              >
                <VscMenu />
              </div>
              <Link href="/" className="NavLogo">
                <Image src={Logo} alt="Logo" className="logoImg" />
              </Link>
            </div>
            <div className="NavSearchContainer" ref={searchRef}>
              <div className={`SearchWrapper ${isSearching ? "focused" : ""}`}>
                <BiSearch className="SearchIcon" />
                <input
                  type="text"
                  placeholder="Search for courses..."
                  value={searchQuery}
                  onFocus={() => setIsSearching(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search courses, live sections, and daily classes"
                />
              </div>

              {/* Search Dropdown — Real API Results */}
              {isSearching && (
                <div className="SearchDropdown">
                  {/* Loading State */}
                  {isInlineLoading && (
                    <div className="SuggestionSection">
                      <div className="SearchLoading" style={{ padding: "16px", textAlign: "center" }}>
                        <div className="spinner"></div>
                        <p>Searching...</p>
                      </div>
                    </div>
                  )}

                  {/* Idle State — Show hints */}
                  {isInlineIdle && (
                    <div className="SuggestionSection">
                      <div className="SuggestItem">
                        <BiTimeFive /> <p>Start typing to search...</p>
                      </div>
                    </div>
                  )}

                  {/* Results State */}
                  {showInlineResults && (
                    <div className="RecommendedSection">
                      <h4>Search Results</h4>
                      <div className="CourseList">
                        {inlineResults.map((result) => (
                          <Link
                            key={`${result.type}-${result.id}`}
                            href={getResultRoute(result)}
                            className="SearchCourseBox"
                            onClick={() => setIsSearching(false)}
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <div className="CourseImg">
                              <Image
                                src={result.thumbnail ? resolveMediaUrl(result.thumbnail) : courseImg1}
                                alt={result.title || "Search result"}
                                width={76}
                                height={56}
                                className="ThumbImg"
                                unoptimized={Boolean(result.thumbnail)}
                              />
                            </div>
                            <div className="CourseDetails">
                              <div className="TypeAndCategory">
                                <span className={`TypeBadge TypeBadge--${result.type}`}>
                                  {getSearchResultTypeLabel(result.type)}
                                </span>
                                {result.category_name && (
                                  <span className="CategoryTag">{result.category_name}</span>
                                )}
                              </div>
                              <h5 className="ItemTitle">{result.title}</h5>
                              <div className="ItemMetaRow">
                                {result.instructor_name && (
                                  <span className="InstructorName">
                                    <FiUser className="MetaIcon" /> {result.instructor_name}
                                  </span>
                                )}
                                {result.price ? (
                                  <span className="PriceTag">
                                    ₹{result.discount_price || result.price}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {isInlineEmpty && (
                    <div className="SuggestionSection" style={{ padding: "16px", textAlign: "center" }}>
                      <FiSearch size={24} color="#999" />
                      <p>No results found</p>
                    </div>
                  )}

                  {/* Error State */}
                  {isInlineError && (
                    <div className="SuggestionSection" style={{ padding: "16px", textAlign: "center" }}>
                      <FiAlertCircle size={24} color="#e74c3c" />
                      <p>Search failed. Please try again.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="NavRightBox">
              <div className="searchCartWishlistBox">
                <div
                  className="SearchIconTrigger SearchIcon"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <BiSearch />
                </div>

                <Link href="/cart" className="CartIcon">
                  <IoCartOutline />
                  {itemCount > 0 && (
                    <span className="cartBadge">
                      {itemCount}
                    </span>
                  )}
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
                  aria-label="Notifications"
                >
                  <IoMdNotificationsOutline />
                  {mounted && isAuthenticated && unreadCount > 0 && (
                    <span className="notifBadge"></span>
                  )}

                  {openNotification && (
                    <div className="NotificationDropdown">
                      {!isAuthenticated ? (
                        <p className="notifItem" style={{ color: "#94a3b8" }}>
                          Please log in
                        </p>
                      ) : isNotificationsLoading ? (
                        <p className="notifItem" style={{ color: "#94a3b8" }}>
                          Loading...
                        </p>
                      ) : previewNotifications.length > 0 ? (
                        previewNotifications.map((notif) => (
                          <p
                            key={notif.id}
                            className={`notifItem ${notif.is_read ? "read" : "unread"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreviewClick(notif);
                            }}
                            title={notif.title}
                          >
                            {notif.title}
                          </p>
                        ))
                      ) : (
                        <p className="notifItem" style={{ color: "#94a3b8" }}>
                          No notifications yet
                        </p>
                      )}
                      <Link
                        href="/notifications"
                        className="viewAll"
                        onClick={() => setOpenNotification(false)}
                      >
                        View All
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              {mounted && !isAuthenticated && (
                <div className="AuthBox">
                  <div className="LoginBox">
                    <Link href="/auth/login" className="authLink">
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
              )}
              <div
                className="UserProfileBox"
                ref={dropdownRef}
                onClick={() => {
                  setOpenDropdown(!openDropdown);
                  setOpenNotification(false);
                }}
              >
                {mounted && isAuthenticated && (
                  <>
                    <div className="ProfileImageBox">
                      <Image src={UserImg} alt="User" className="UserImage" />
                    </div>

                    <div className="UserNameDropIconBox">
                      <div className="UserNameBox">
                        <p className="UserWelcome">Hi Welcome</p>
                        <p className="UserName">{user.name}</p>
                      </div>
                      <MdKeyboardArrowDown className="DropIcon" />
                    </div>
                  </>
                )}

                {openDropdown && (
                  <div className="UserDropdown">
                    <Link href="/auth/profile" className="DropItem">
                      <MdPerson /> Profile
                    </Link>

                    <div className="DropItem borderBottom">
                      <MdNotifications /> Notifications
                    </div>

                    <div 
                      className="DropItem"
                      onClick={() => {
                        handleLogout();
                        setOpenDropdown(false);
                      }}
                    >
                      <MdLogout /> Logout
                    </div>
                  </div>
                )}
              </div>
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
