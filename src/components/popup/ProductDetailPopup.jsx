"use client";
import React, { useState, useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiShoppingCart, FiCheck } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, EffectFade } from 'swiper/modules';
import Image from 'next/image';
import { AiFillStar } from 'react-icons/ai';
// Swiper Styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';

const ProductDetailPopup = ({ product, onClose, onToggleCart, isAdded }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  // Prevent background scroll when popup is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!product) return null;

  // Mock thumbnails (replace with product.images if available)
  const productImages = [product.image, product.image, product.image, product.image];

  return (
    <div className='ProductPopupOverlay' onClick={onClose}>
      <div className='ProductPopupContent' onClick={(e) => e.stopPropagation()}>
        <button className='ClosePopup' onClick={onClose} aria-label="Close popup">
          <FiX />
        </button>

        <div className='PopupBodyScroll'>
          {/* Main Slider Area */}
          <div className='MainSliderSection'>
            <Swiper
              modules={[Navigation, Thumbs, EffectFade]}
              effect={'fade'}
              thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
              navigation={{
                nextEl: '.main-next',
                prevEl: '.main-prev',
              }}
              className='MainImageSwiper'
            >
              {productImages.map((img, i) => (
                <SwiperSlide key={i}>
                  <div className='MainSlideImg'>
                    <Image src={img} alt={`${product.title} ${i}`} layout="fill" objectFit="cover" />
                  </div>
                </SwiperSlide>
              ))}
              
              <button className='main-prev custom-nav'><FiChevronLeft /></button>
              <button className='main-next custom-nav'><FiChevronRight /></button>
            </Swiper>

            {/* Thumbnails Section */}
            <div className='ThumbnailsWrapper'>
               <button className='thumb-prev'><FiChevronLeft /></button>
               <Swiper
                onSwiper={setThumbsSwiper}
                spaceBetween={12}
                slidesPerView={4}
                watchSlidesProgress={true}
                modules={[Navigation, Thumbs]}
                navigation={{
                    nextEl: '.thumb-next',
                    prevEl: '.thumb-prev',
                }}
                className='ThumbSwiper'
              >
                {productImages.map((img, i) => (
                  <SwiperSlide key={i}>
                    <div className='ThumbSlideImg'>
                      <Image src={img} alt="thumb" width={80} height={80} objectFit="cover" />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              <button className='thumb-next'><FiChevronRight /></button>
            </div>
          </div>

          {/* Details Content */}
          <div className='ProductTextDetails'>
            <div className='TitleRow'>
                <span className='CategoryTag'>Premium Gear</span>
                <h3>{product.title}</h3>
                <div className='Stars'>
                    <AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar />
                    <span>(48 Reviews)</span>
                </div>
            </div>
            
            <div className='DetailSection'>
                <h4>Description</h4>
                <p className='ProdDesc'>
                    Elevate your practice with the {product.title}. Specifically engineered for {product.title.toLowerCase().includes('mat') ? 'grip and comfort' : 'support and alignment'}, this professional-grade gear is a must-have for both beginners and advanced yogis. 
                    Made from high-quality, eco-friendly materials, it ensures a safe and sustainable practice session every time.
                </p>
                <ul className='FeatureList'>
                    <li><FiCheck /> Non-slip surface for superior stability</li>
                    <li><FiCheck /> Odor-resistant and easy to clean</li>
                    <li><FiCheck /> 100% Recyclable and non-toxic material</li>
                </ul>
            </div>
            
            <div className='DetailSection'>
              <h4>Specifications</h4>
              <div className='SpecGrid'>
                <div className='SpecItem'><span>Material:</span> Eco-friendly TPE / Foam</div>
                <div className='SpecItem'><span>Dimensions:</span> 183cm x 61cm</div>
                <div className='SpecItem'><span>Thickness:</span> 6mm High Density</div>
                <div className='SpecItem'><span>Weight:</span> Approx. 1.2kg</div>
                <div className='SpecItem'><span>Color:</span> Deep Crimson / Slate</div>
                <div className='SpecItem'><span>Warranty:</span> 1 Year Manufacturing</div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Bar */}
        <div className='PopupFixedBottom'>
          <div className='LeftBrief'>
            <div className='ImgBox'>
                <Image src={product.image} alt="brief" width={50} height={50} />
            </div>
            <div className='Text'>
              <h5>{product.title}</h5>
              <p className='PriceRow'>₹{product.price} <del>₹1,499</del></p>
            </div>
          </div>
          <button 
            className={`PopupCartBtn ${isAdded ? 'added' : ''}`}
            onClick={() => onToggleCart(product.id)}
          >
            {isAdded ? (
                <><FiShoppingCart /> Remove from Cart</>
            ) : (
                <><FiShoppingCart /> Add to Cart</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPopup;