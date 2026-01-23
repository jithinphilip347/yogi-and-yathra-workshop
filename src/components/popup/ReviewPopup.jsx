"use client";
import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import Image from 'next/image';
import Inst1 from '../../assets/images/instructor-1.jpg'; 

const ReviewPopup = ({ onClose }) => {
  
  // ബാക്ക്ഗ്രൗണ്ട് സ്ക്രോൾ ലോക്ക് ചെയ്യാൻ
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className='ReviewPopupOverlay' onClick={onClose}>
      <div className='RePopupContent ReviewContainer' onClick={(e) => e.stopPropagation()}>
        <div className='PopupHeader'>
          <h3>All Student Reviews</h3>
          <button className='CloseBtn' onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className='PopupBody Scrollable'>
          {/* റിവ്യൂ ലിസ്റ്റ് - നിങ്ങൾ നൽകിയ ഇമേജ് ഡിസൈൻ പ്രകാരം */}
          {[1, 2, 3, 4, 5].map((rev) => (
            <div key={rev} className='SingleReviewItem'>
              <div className='ReviewTop'>
                <div className='UserMeta'>
                  <div className='UserImg'>
                  <Image src={Inst1} alt="User" className='UserImg' />
                  </div>                 
                  <div className='UserInfo'>
                    <h5>Emma Crieght</h5>
                    <span>4 months ago</span>
                  </div>
                    </div>
                     <div className='UserStars'>
                      <AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar />
                      <span className='RatingNum'>5.0</span>
                    </div>
                
              </div>
              <p className='Comment'>
                Effortless booking, unbeatable affordability! Small yet comfortable rooms in the heart of Sheffield&apos;`s nightlife hub. Surrounded by elegant housing, it&apos;`s a peaceful gem. Thumbs up!
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewPopup;