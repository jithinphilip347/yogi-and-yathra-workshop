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
        </div>
        <div className="footerColumn">
          <h4>Information</h4>
          <ul>
            <li><Link href="#">About Us</Link></li>
            <li><Link href="#">Blog</Link></li>
            <li><Link href="#">Testimonials</Link></li>
          </ul>
        </div>

        <div className="footerColumn">
          <h4>Helpful Links</h4>
          <ul>
            <li><Link href="#">Supports</Link></li>
            <li><Link href="#">Terms & Conditions</Link></li>
            <li><Link href="#">Privacy Policy</Link></li>
          </ul>
        </div>

        <div className="footerColumn">
          <h4>Our Services</h4>
          <ul>
            <li><Link href="#">Orders</Link></li>
            <li><Link href="#">Return & Exchange</Link></li>
          </ul>
        </div>

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


      <div className="footerBottom">
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
