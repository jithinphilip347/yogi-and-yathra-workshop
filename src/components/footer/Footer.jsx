"use client";
import React from "react";
import {
  FaFacebookF,
  FaGoogle,
  FaTwitter,
  FaInstagram,
  FaPhoneAlt,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";
import FooterLogo from '../../assets/images/footer-logo.png'

const Footer = () => {
  return (
    <footer id="Footer">
      <div className="container ">
        <div className="FooterMain">
        <div className="footerColumn">
          <Link href="/" className="footerLogo">
          <div className="FooterLogo">
            <Image src={FooterLogo} alt="" />
          </div>
          </Link>
          {/* <p className="footerTag">Your Tagline here</p> */}

          {/* <h4 className="footerSubTitle">Subscribe Now</h4>
          <div className="subscribeBox">
            <input type="email" placeholder="Enter your Email" />
            <button>Subscribe</button>
          </div> */}
        </div>
        {/* Column 2 */}
        <div className="footerColumn">
          <h4>Information</h4>
          <ul>
            <li><Link href="#">About Us</Link></li>
            {/* <li><Link href="#">More Search</Link></li> */}
            <li><Link href="#">Blog</Link></li>
            <li><Link href="#">Testimonials</Link></li>
            {/* <li><Link href="#">Events</Link></li> */}
          </ul>
        </div>

        {/* Column 3 */}
        <div className="footerColumn">
          <h4>Helpful Links</h4>
          <ul>
            {/* <li><Link href="#">Services</Link></li> */}
            <li><Link href="#">Supports</Link></li>
            <li><Link href="#">Terms & Conditions</Link></li>
            <li><Link href="#">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Column 4 */}
        <div className="footerColumn">
          <h4>Our Services</h4>
          <ul>
            {/* <li><Link href="#">Brands list</Link></li> */}
            <li><Link href="#">Orders</Link></li>
            <li><Link href="#">Return & Exchange</Link></li>
            {/* <li><Link href="#">Fashion list</Link></li> */}
            {/* <li><Link href="#">Blog</Link></li> */}
          </ul>
        </div>

        {/* Column 5 */}
        <div className="footerColumn">
          <h4>Contact Us</h4>
          <p className="contactRow">
            <FaPhoneAlt /> +91 9999 999 999
          </p>
          <p className="contactRow">
            <MdEmail /> youremailid.com
          </p>

          <div className="footerSocial">
            <Link href="#"><FaFacebookF /></Link>
            <Link href="#"><FaGoogle /></Link>
            <Link href="#"><FaTwitter /></Link>
            <Link href="#"><FaInstagram /></Link>
          </div>
        </div>
        </div>

      </div>

      <div className="footerBottom">
        <div className="container">
          <div className="footerBottomMain">
                <div className="footerBottomBox">
        <p>© 2025 company. Ltd | All Right reserved</p>

                </div>
            <div className="footerBottomLinks">
          <Link href="#">FAQ</Link>
          <Link href="#">Privacy</Link>
          <Link href="#">Terms & Condition</Link>
        </div>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
