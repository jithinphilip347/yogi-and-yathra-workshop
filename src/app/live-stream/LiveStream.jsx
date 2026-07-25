"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import '../../assets/css/live-stream.scss';
import { MdArrowBack, MdStar, MdFullscreen, MdFullscreenExit, MdCheckCircle, MdCancel, MdEvent, MdAccessTime, MdLiveTv } from 'react-icons/md';
import { FaChalkboardTeacher } from 'react-icons/fa';

const LiveStream = () => {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoRef.current?.requestFullscreen) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div id='LiveStreamFull'>
      <div className="VideoSection" ref={videoRef}>
        <button className="BackBtnOverlay" onClick={() => router.back()}>
          <MdArrowBack />
        </button>

        <div className="VideoPlaceholder">
          {/* Zoom SDK Render Area */}
        </div>

        <button className="FullscreenBtnOverlay" onClick={toggleFullscreen}>
          {isFullscreen ? <MdFullscreenExit /> : <MdFullscreen />}
        </button>
      </div>

      <div className="StreamContainer">
        <div className="MainInfoRow">
          <div className="InfoLeft">
            <h1 className="StreamTitle">Advanced Vinyasa Flow</h1>
            <p className="StreamSubtitle">Build flexibility and core strength.</p>
          </div>

          <div className="InfoMiddle">
            <img src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=150&h=150" alt="Sarah Jenkins" className="InstructorAvatar" />
            <div className="InstructorDetails">
              <h3 className="Name">Sarah Jenkins</h3>
              <div className="InstructorMeta">
                <span className="Rating"><MdStar className="StarIcon"/> 4.9</span>
                <span className="Students">5000+ Students Trained</span>
              </div>
            </div>
          </div>

          <div className="InfoRight">
            <div className="StatsGroup">
              <div className="StatItem">
                <span className="StatValue">07:00 AM - 08:30 AM</span>
                <span className="StatLabel">Duration</span>
              </div>
            </div>
            <div className="LiveNowBadge">
              <span className="LiveDot"></span> LIVE NOW
            </div>
          </div>
        </div>

        {/* Detailed Sections added below the video and main info */}
        <div className="StreamDetailsGrid">
          
          <div className="DetailsLeft">
            <section className="DetailSection">
              <h2 className="SectionTitle">About This Live Session</h2>
              <p className="SectionText">
                Join us for an invigorating 90-minute Advanced Vinyasa Flow designed to build heat, endurance, and deep core strength. This session will guide you through complex transitions, arm balances, and deep stretches, leaving you feeling energized and centered.
              </p>
              <div className="InfoPills">
                <span className="Pill"><MdLiveTv className="PillIcon" /> Live Session</span>
                <span className="Pill"><MdCheckCircle className="PillIcon" /> Certificate</span>
                <span className="Pill"><MdEvent className="PillIcon" /> Live Q&A</span>
                <span className="Pill"><MdAccessTime className="PillIcon" /> Recording</span>
                <span className="Pill"><FaChalkboardTeacher className="PillIcon" /> Expert Instructor</span>
                <span className="Pill"><MdEvent className="PillIcon" /> Flexible</span>
              </div>
            </section>

            <section className="DetailSection">
              <h2 className="SectionTitle">What You&apos;ll Learn</h2>
              <ul className="LearnList">
                <li><MdCheckCircle className="CheckIcon" /> Sun Salutation Variations</li>
                <li><MdCheckCircle className="CheckIcon" /> Breath Synchronization</li>
                <li><MdCheckCircle className="CheckIcon" /> Hip Opening Techniques</li>
                <li><MdCheckCircle className="CheckIcon" /> Shoulder Mobility</li>
                <li><MdCheckCircle className="CheckIcon" /> Deep Core Strength</li>
                <li><MdCheckCircle className="CheckIcon" /> Guided Meditation</li>
              </ul>
            </section>

            <div className="FitGrid">
              <div className="FitBox PerfectFor">
                <h3 className="BoxTitle"><MdCheckCircle className="TitleIcon" /> Perfect For</h3>
                <ul>
                  <li><MdCheckCircle className="ListIcon" /> Beginners looking for basics</li>
                  <li><MdCheckCircle className="ListIcon" /> Office Employees with back pain</li>
                  <li><MdCheckCircle className="ListIcon" /> Students needing focus</li>
                  <li><MdCheckCircle className="ListIcon" /> Stress & Anxiety Relief</li>
                  <li><MdCheckCircle className="ListIcon" /> Weight Loss Goals</li>
                  <li><MdCheckCircle className="ListIcon" /> Improving Flexibility</li>
                </ul>
              </div>
              <div className="FitBox NotFor">
                <h3 className="BoxTitle"><MdCancel className="TitleIcon" /> Not Recommended For</h3>
                <ul>
                  <li><MdCancel className="ListIcon" /> Recent Surgery Recovery</li>
                  <li><MdCancel className="ListIcon" /> High Fever or Illness</li>
                  <li><MdCancel className="ListIcon" /> Pregnancy (unless doctor approved)</li>
                  <li><MdCancel className="ListIcon" /> Serious Joint Injuries</li>
                </ul>
              </div>
            </div>

            <section className="DetailSection">
              <h2 className="SectionTitle">Features Included</h2>
              <ul className="FeaturesList">
                <li><MdCheckCircle className="CheckIcon" /> Live Chat Support</li>
                <li><MdCheckCircle className="CheckIcon" /> Ask Questions Direct</li>
                <li><MdCheckCircle className="CheckIcon" /> 30-Day Recording Access</li>
                <li><MdCheckCircle className="CheckIcon" /> E-Certificate</li>
                <li><MdCheckCircle className="CheckIcon" /> Lifetime Community</li>
                <li><MdCheckCircle className="CheckIcon" /> Mobile & Web Friendly</li>
              </ul>
            </section>
          </div>

          {/* <div className="DetailsRight">
            <section className="DetailSection AgendaSection">
              <h2 className="SectionTitle">Session Agenda</h2>
              <div className="SimpleAgendaList">
                <div className="SimpleAgendaItem">
                  <span className="AgendaTime">07:00 AM</span>
                  <span className="AgendaDesc">Introduction & Intention Setting</span>
                </div>
                <div className="SimpleAgendaItem">
                  <span className="AgendaTime">07:10 AM</span>
                  <span className="AgendaDesc">Gentle Warm Up & Breathing</span>
                </div>
                <div className="SimpleAgendaItem">
                  <span className="AgendaTime">07:25 AM</span>
                  <span className="AgendaDesc">Main Vinyasa Core Flow</span>
                </div>
                <div className="SimpleAgendaItem">
                  <span className="AgendaTime">08:00 AM</span>
                  <span className="AgendaDesc">Cool Down & Deep Stretches</span>
                </div>
                <div className="SimpleAgendaItem">
                  <span className="AgendaTime">08:15 AM</span>
                  <span className="AgendaDesc">Guided Meditation (Savasana)</span>
                </div>
                <div className="SimpleAgendaItem">
                  <span className="AgendaTime">08:20 AM</span>
                  <span className="AgendaDesc">Live Q&A Session</span>
                </div>
                <div className="SimpleAgendaItem">
                  <span className="AgendaTime">08:30 AM</span>
                  <span className="AgendaDesc">Closing & Gratitude</span>
                </div>
              </div>
            </section>
          </div> */}
          
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="MobileLiveBar">
        <div className="MobileLiveBadge">
          <span className="LiveDot"></span> LIVE
        </div>
      </div>
    </div>
  )
}

export default LiveStream;