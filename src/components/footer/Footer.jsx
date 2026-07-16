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
              <Link href="#"><FaFacebookF /></Link>
              <Link href="#"><FaInstagram /></Link>
              <Link href="#"><FaYoutube /></Link>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footerColumn">
            <h4>COMPANY</h4>
            <ul>
              <li><Link href="#">About Us</Link></li>
              <li><Link href="#">Workshops</Link></li>
              <li><Link href="#">Classes</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
            </ul>
          </div>

          {/* Column 3: Help */}
          <div className="footerColumn">
            <h4>SUPPORT</h4>
            <ul>
              <li><Link href="#">FAQ</Link></li>
              <li><Link href="#">Help Center</Link></li>
              <li><Link href="#">Terms of Service</Link></li>
              <li><Link href="#">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="footerColumn">
            <h4>CONTACT US</h4>
            <div className="contactList">
              <p className="contactRow">
                <MdEmail /> support@yogiandyathra.com
              </p>
              <p className="contactRow">
                <FaPhoneAlt /> +91 1800-3232-8686
              </p>
              <p className="contactRow">
                <FaMapMarkerAlt /> 123 Wellness Avenue, Kerala, India
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footerBottom">
          <div className="footerBottomMain">
            <p className="copyrightText">© {new Date().getFullYear()} Yogi and Yathra. All Rights Reserved.</p>
            <p className="designedBy">Designed by <Link href="#">VATL</Link></p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;