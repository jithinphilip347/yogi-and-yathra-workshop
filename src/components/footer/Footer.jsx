"use client";
import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaPhoneAlt,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import Link from "next/link";

const Footer = () => {
  return (
    <footer id="Footer">
      <div className="container">
        <div className="footerTopSection">
          <div className="footerSlogan">
            <h2>Sip Your Way To Wellness One Cup At A Time.</h2>
          </div>
          <div className="footerNewsletter">
            <p>Get In Touch!</p>
            <div className="subscribeBox">
              <input type="email" placeholder="Enter your email" />
              <button>Subscribe</button>
            </div>
          </div>
        </div>

        <div className="FooterMain">
          <div className="footerColumn">
            <h4>CONTACT INFORMATION</h4>
            <p className="contactRow">
              <MdEmail /> support@teacircle.com
            </p>
            <p className="contactRow">
              <FaPhoneAlt /> 1800-3232-8686
            </p>
          </div>

          <div className="footerColumn">
            <h4>COMPANY</h4>
            <ul>
              <li><Link href="#">Features</Link></li>
              <li><Link href="#">About Us</Link></li>
              <li><Link href="#">Contact</Link></li>
              <li><Link href="#">Pricing</Link></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4>HELP</h4>
            <ul>
              <li><Link href="#">FAQ</Link></li>
              <li><Link href="#">Help Center</Link></li>
              <li><Link href="#">Support</Link></li>
            </ul>
          </div>

          <div className="footerColumn">
            <h4>FOLLOW US</h4>
            <div className="footerSocial">
              <Link href="#"><FaFacebookF /></Link>
              <Link href="#"><FaInstagram /></Link>
              <Link href="#"><FaYoutube /></Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footerBottom">
          <div className="footerBottomMain">
            <div className="footerBottomBox">
              <p>© 2025 Yogi and Yathra All Rights Reserved.</p>
            </div>
            <div className="footerBottomLinks">
              <Link href="#">Privacy</Link>
              <Link href="#">Terms & condition</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;