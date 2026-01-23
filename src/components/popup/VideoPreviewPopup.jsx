"use client"; // Next.js Client Component aayathinal ithu urappu varuthuka
import React, { useEffect } from 'react';
import { FiX, FiCheckCircle } from 'react-icons/fi';

const VideoPreviewPopup = ({ onClose }) => {
  
  // Background scroll lock logic
  useEffect(() => {
    // Popup thurakkumpol scroll lock cheyyunnu
    document.body.style.overflow = 'hidden';

    // Popup close aakumbol (Component unmount aakumbol) scroll thirike active aakkunnu
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className='PopupOverlay' onClick={onClose}>
      <div className='PopupContent VideoContainer' onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className='CloseBtn' onClick={onClose}>
          <FiX />
        </button>

        <div className='VideoArea'>
          <div className='VideoWrapper'>
            <iframe 
              width="100%" 
              height="380" 
              src="https://www.youtube.com/embed/your-video-id" 
              title="Course Preview" 
              frameBorder="0" 
              allowFullScreen
            ></iframe>
          </div>
        </div>

        <div className='PopupBodyScroll'>
          <div className='VideoInfo'>
            <span className='Label'>Course Preview</span>
            <h4>The Complete Professional Mastery Bootcamp 2026</h4>
            <p className='ShortDesc'>
              Get an exclusive look at our curriculum. This video covers the core foundations you will master throughout this journey.
            </p>

            <div className='CourseBriefInfo'>
              <h5>What&apos;s inside this course?</h5>
              <ul className='Highlights'>
                <li><FiCheckCircle /> 54 hours on-demand video</li>
                <li><FiCheckCircle /> 25+ Real-world professional projects</li>
                <li><FiCheckCircle /> Access on mobile and TV</li>
                <li><FiCheckCircle /> Certificate of completion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewPopup;