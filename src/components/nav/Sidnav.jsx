"use client";
import React, { useState, useEffect } from 'react';
import UserImg from "../../assets/images/user.jpg";
import Link from 'next/link';
import { 
  MdClose, 
  MdKeyboardArrowDown, 
  MdFavoriteBorder, 
  MdOutlineInfo, 
  MdOutlineContactSupport 
} from "react-icons/md";
import { IoMdNotificationsOutline } from "react-icons/io"; 
import { IoCartOutline } from "react-icons/io5";
import { HiOutlineHome, HiOutlineBookOpen } from "react-icons/hi";
import { BiNews } from "react-icons/bi";
import Image from 'next/image';

const Sidnav = ({ isOpen, onClose }) => {
  const [isCourseOpen, setIsCourseOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const categories = [
    { name: "Development", slug: "development" },
    { name: "Business", slug: "business" },
    { name: "Design", slug: "design" },
    { name: "Marketing", slug: "marketing" },
    { name: "Health & Fitness", slug: "health-fitness" },
    { name: "Music", slug: "music" },
  ];

  return (
    <>
      <div className={`SideNavOverlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>

      <div id='Sidnav' className={isOpen ? 'open' : ''}>
        <div className="SideNavHeader">
          <div className="CloseIcon" onClick={onClose}>
            <MdClose />
          </div>
        </div>
            <div className="UserProfileBox"
         
            >
              <div className="ProfileImageBox">
                <Image src={UserImg} alt="User" className="UserImage" />
              </div>

              <div className="UserNameDropIconBox">
                <div className="UserNameBox">
                  <p className="UserWelcome">Hi Welcome</p>
                  <p className="UserName">Achu Sivadasan</p>
                </div>
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
              <div className="SideNavLinkItem" onClick={() => setIsCourseOpen(!isCourseOpen)}>
                <div className="itemLeft">
                   <HiOutlineBookOpen /> Courses
                </div>
                <MdKeyboardArrowDown className={isCourseOpen ? 'rotate' : ''} />
              </div>
              
              <ul className={`SideSubMenu ${isCourseOpen ? 'show' : ''}`}>
                {categories.map((cat, i) => (
                  <li key={i}>
                    <Link href={`/course/${cat.slug}`} onClick={onClose}>{cat.name}</Link>
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
              <Link href="/notifications" onClick={onClose}>
                <IoMdNotificationsOutline /> Notifications
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

export default Sidnav;