"use client";
import React from "react";
import Link from "next/link";
import { FiChevronRight, FiHome } from "react-icons/fi";
import './Breadcrumbs.css';

const Breadcrumbs = ({ items }) => {
  return (
    <nav className="BreadcrumbsContainer" aria-label="breadcrumb">
      <ul className="BreadcrumbsList">
        {/* Home Icon/Link eppozhum default aayi veykkunnu */}
        <li className="BreadcrumbItem">
          <Link href="/" className="BreadcrumbLink HomeLink">
            <FiHome />
            <span>Home</span>
          </Link>
        </li>

        {items && items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={index}>
              <li className="Separator">
                <FiChevronRight />
              </li>
              <li className={`BreadcrumbItem ${isLast ? "active" : ""}`}>
                {isLast ? (
                  <span className="CurrentPage">{item.label}</span>
                ) : (
                  <Link href={item.path} className="BreadcrumbLink">
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;