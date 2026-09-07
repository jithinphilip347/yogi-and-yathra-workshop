"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdKeyboardArrowDown } from "react-icons/md";
import { fetchCategories } from '@/libs/course';

const SubNav = () => {
  const pathname = usePathname();
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [categories, setCategories] = useState([]);

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