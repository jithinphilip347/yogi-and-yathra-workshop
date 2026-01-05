"use client"
import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import Image from 'next/image';
import { FaLinkedinIn, FaTwitter, FaInstagram, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import Team1 from '../../assets/images/team-1.jpg';
import Team2 from '../../assets/images/team-2.jpg';
import Team3 from '../../assets/images/team-3.jpg';


// Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

const HomeTeacher = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const teamMembers = [
    {
      id: 1,
      name: "Alice Johnson",
      role: "CEO & Founder",
      desc: "Alice has over 15 years of experience in strategic leadership and business development.",
      isBlue: true
    },
    { id: 2, 
        name: "Carter Botosh", 
        role: "Chief Financial Officer",
        img: Team1,
    },

    { id: 3, 
        name: "Phillip Ekstrom", 
        role: "Head of Technology", 
        img: Team2 ,
    },
    { id: 4, 
        name: "Abram Culhane", 
        role: "Head of Technology", 
        img: Team3 ,
    },
  ];

  return (
    <section id='HomeTeacher'>
      <div className='container'>
        <div className='HomeTeacherHeader'>
          <div className="title-area">
            <span className='badge'>EXPERTISE</span>
            <h2>Explore our comprehensive <br /> service offerings</h2>
          </div>
          
          {/* Custom Navigation Buttons */}
          <div className='nav-buttons'>
            <button ref={prevRef} className='nav-btn'><BsArrowLeft /></button>
            <button ref={nextRef} className='nav-btn'> <BsArrowRight /></button>
          </div>
        </div>

        <div className='HomeTeacherMain'>
          <Swiper
            modules={[Navigation]}
            spaceBetween={20}
            slidesPerView={1.2}
            onInit={(swiper) => {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
              swiper.navigation.init();
              swiper.navigation.update();
            }}
            breakpoints={{
              640: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3.8 },
            }}
          >
            {teamMembers.map((member) => (
              <SwiperSlide key={member.id}>
                {member.isBlue ? (
                  <div className="card blue-card">
                    <h3>{member.name}</h3>
                    <p className="role">{member.role}</p>
                    <p className="desc">{member.desc}</p>
                    <div className="social-links">
                      <FaLinkedinIn /> <FaTwitter /> <FaInstagram />
                    </div>
                  </div>
                ) : (
                  <div className="card image-card">
                <div className="img-placeholder">
                <Image 
                    src={member.img} 
                    alt={member.name} 
                    fill 
                    style={{ objectFit: 'cover' }} 
                    priority={member.id === 2} 
                />
            </div>
                    <div className="card-info">
                      <h4>{member.name}</h4>
                      <p>{member.role}</p>
                    </div>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default HomeTeacher;