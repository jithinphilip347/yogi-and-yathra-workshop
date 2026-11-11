"use client";
import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaPhoneAlt,
  FaMapMarkerAlt
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../assets/images/logo.png";

const Footer = () => {
  return (
    <footer id="Footer">
      <div className="container">
        <div className="FooterMain">
          {/* Column 1: Brand & About */}
          <div className="footerColumn brandColumn">
            <div className="footerLogoBox">
              <Link href="/">
                <Image src={Logo} alt="Logo" className="logoImg" />
              </Link>
            </div>
            <p>
              Empowering you to find balance, peace, and strength through the art of Yoga. Join our community and begin your wellness journey today.
            </p>
            <div className="footerSocial">
              <a href="https://www.facebook.com/yogiandyathra" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF /></a>
              <a href="https://www.instagram.com/yogiandyathra" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
              <a href="https://www.youtube.com/@yogiandyathra" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><FaYoutube /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footerColumn">
            <h4>COMPANY</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/course">Workshops</Link></li>
              <li><Link href="/live-class">Classes</Link></li>
            </ul>
          </div>

          {/* Column 3: Help */}
          <div className="footerColumn">
            <h4>SUPPORT</h4>
            <ul>
              <li>
                <Link
                  href="/#HomeFAQ"
                  onClick={(e) => {
                    if (typeof window !== "undefined" && window.location.pathname === "/") {
                      const el = document.getElementById("HomeFAQ") || document.getElementById("faq");
                      if (el) {
                        e.preventDefault();
                        el.scrollIntoView({ behavior: "smooth" });
                        window.history.pushState(null, "", "#HomeFAQ");
                      }
                    }
                  }}
                >
                  FAQ
                </Link>
              </li>
              <li><Link href="/contact">Help Center</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="footerColumn">
            <h4>CONTACT US</h4>
            <div className="contactList">
              <a href="mailto:support@yogiandyathra.com" className="contactRow contactLink">
                <MdEmail /> support@yogiandyathra.com
              </a>
              <a href="tel:+916282847517" className="contactRow contactLink">
                <FaPhoneAlt /> +91 6282 847 517
              </a>
              <p className="contactRow">
                <FaMapMarkerAlt /> Yogify, Elavoor Kavala, Karukutty, Angamaly, Kerala Pin: 683576
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footerBottom">
          <div className="footerBottomMain">
            <p className="copyrightText">© {new Date().getFullYear()} Yogi and Yathra. All Rights Reserved.</p>
            <div className="developedBy">
              <a
                href="https://varixialabs.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="developedByLink"
                style={{
                  color: "#ffffff",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ color: "#ffffff", textDecoration: "none" }}>Developed by</span>
                <Image
                  src="/design-logo.png"
                  alt="VATL - Varixia Labs"
                  width={58}
                  height={13}
                  style={{ height: "13px", width: "auto", display: "inline-block" }}
                  className="developedByLogo"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
