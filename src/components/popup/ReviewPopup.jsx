"use client";
import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import Image from 'next/image';
import Inst1 from '../../assets/images/instructor-1.jpg'; 
import useReview from '@/hooks/useReview';
import useFormatDate from '@/hooks/useFormatDate';
import { MEDIA_BASE_URL } from '@/utils/constants';

const ReviewPopup = ({ onClose, course_id }) => {
  
  const { getCourseReview } = useReview({ course_id: course_id, perPage: 10 });
  const { getHowLongAgo } = useFormatDate();
  const reviews = getCourseReview.data;
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
          {reviews?.data?.map((rev) => (
            <div key={rev.id} className='SingleReviewItem'>
              <div className='ReviewTop'>
                <div className='UserMeta'>
                  <div className='UserImg'>
                  <Image src={MEDIA_BASE_URL + rev.user.avatar} alt="User" className='UserImg' width={40} height={40} />
                  </div>                 
                  <div className='UserInfo'>
                    <h5>{rev.user.name}</h5>
                    <span>{getHowLongAgo(rev.created_at)}</span>
                  </div>
                    </div>
                     <div className='UserStars'>
                      {[1, 2, 3, 4, 5].map((star) => (
                          <AiFillStar key={star} style={{ color: star <= rev.rating ? '#FFD700' : '#ccc' }} />
                      ))}
                      <span className='RatingNum'>{rev.rating}</span>
                    </div>
                
              </div>
              <p className='Comment'>
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewPopup;