"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdKeyboardArrowDown, MdFlight, MdOutlineShoppingBag, MdSelfImprovement } from "react-icons/md";
import { FiCalendar } from "react-icons/fi";
import { fetchCategories } from '@/libs/course';
import "./SubNav.scss";

const SubNav = () => {
  const pathname = usePathname();
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  // Active platform indicator logic:
  // - If URL starts with /travel => Travel is active
  // - If URL starts with /event => Events is active
  // - Otherwise => Workshop is active by default!
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
      id: "travel",
      name: "Travel",
      path: "/travel",
      icon: MdFlight,
      isExternal: false,
    },
    {
      id: "events",
      name: "Events",
      path: "/event",
      icon: FiCalendar,
      isExternal: false,
    },
    {
      id: "ecommerce",
      name: "E-Commerce",
      path: "https://www.yogiandyathra.com/",
      icon: MdOutlineShoppingBag,
      isExternal: true,
    },
  ];

  const mainLinks = [
    { name: "Home", path: "/" },
    { name: "Courses", path: "/course", hasDropdown: true }, 
    { name: "About", path: "/about" },
    { name: "Blog", path: "/blog" },
    { name: "Contact", path: "/contact" },
  ];

  useEffect(() => {
    fetchCategories().then((res) => {
      setCategories(res || []);
    });
  }, []);

  return (
    <div id='SubNav'>
      <div className='container'>
        <div className='SubNavMain'>
          <div className='SubNavLinks'>
            <ul className="mainUl">
              {mainLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.path} 
                    className={`${pathname === link.path ? 'active' : ''}`}
                    onClick={(e) => {
                      if(link.hasDropdown) {
                        e.preventDefault();
                        setIsCoursesOpen(!isCoursesOpen); 
                      } else {
                        setIsCoursesOpen(false); 
                      }
                    }}
                  >
                    {link.name} {link.hasDropdown && <MdKeyboardArrowDown className={isCoursesOpen ? 'rotate' : ''} />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Flipkart-Style Vertical Switcher */}
          <div className="SubNavVerticalSwitcher" aria-label="Switch Platform Vertical">
            {verticalSwitchers.map((item) => {
              const Icon = item.icon;
              const isActive = activeVertical === item.id;
              
              if (item.isExternal) {
                return (
                  <a
                    key={item.id}
                    href={item.path}
                    className={`verticalSwitchBtn ${isActive ? "active" : ""}`}
                    title={`Go to ${item.name}`}
                  >
                    <Icon className={`switchIcon icon-${item.id}`} />
                    <span className="switchLabel">{item.name}</span>
                  </a>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`verticalSwitchBtn ${isActive ? "active" : ""}`}
                  title={`Switch to ${item.name}`}
                >
                  <Icon className={`switchIcon icon-${item.id}`} />
                  <span className="switchLabel">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {isCoursesOpen && (
        <div className="CategoryStrip">
          <div className="container">
            <ul className="categoryUl">
              <li>
                <Link href="/course" onClick={() => setIsCoursesOpen(false)}>
                  All Courses
                </Link>
              </li>
              {categories.map((cat, i) => (
                <li key={cat.id || i}>
                  <Link href={`/course?category=${cat.id || cat.slug}`} onClick={() => setIsCoursesOpen(false)}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubNav;
