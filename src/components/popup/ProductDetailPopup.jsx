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
import useProduct from '@/hooks/useProduct';
import { PRODUCT_MEDIA_BASE_URL } from "@/utils/constants"

const ProductDetailPopup = ({ product, onClose, onToggleCart, isAdded }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
 
  // Call hook unconditionally
  const { productQuery } = useProduct({ 
    id: product?.id || product?.value, 
    type: product?.type || 'normal' 
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!product) return null;

  const isLoading = productQuery.isLoading;
  const rawData = productQuery.data;

  // Normalization Step
  let displayData = {
    title: product.label || product.title,
    price: product.price,
    oldPrice: product.oldPrice || 1499,
    description: "",
    images: [product.image],
    specs: {},
    isCombo: product.type === 'combo',
    comboItems: []
  };

  if (rawData) {
    if (product.type === 'combo') {
      // Combo Structure
      displayData = {
        title: rawData.title,
        price: rawData.combo_price || rawData.price,
        oldPrice: rawData.original_price || rawData.price,
        description: rawData.specifications,
        images: rawData.media?.length > 0 
                  ? rawData.media.map(m => `${PRODUCT_MEDIA_BASE_URL}${m.file_path}`) 
                  : [product.image],
        specs: {},
        isCombo: true,
        comboItems: rawData.products || []
      };
    } else {
      // Normal Product Structure (wrapped in .product)
      const p = rawData.product;
      if (p) {
        displayData = {
          title: p.name,
          price: p.sale_price || p.price,
          oldPrice: p.price,
          description: p.description,
          images: p.media?.length > 0 
                    ? p.media.map(m => `${PRODUCT_MEDIA_BASE_URL}${m.file_path}`) 
                    : [product.image],
          specs: p.custom_feilds || {},
          isCombo: false,
          comboItems: []
        };
      }
    }
  }

  const productImages = displayData.images;

  if (isLoading) {
    return (
      <div className='ProductPopupOverlay'>
        <div className='ProductPopupContent' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader">Loading...</div>
        </div>
      </div>
    );
  }

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
                    <Image 
                      src={img.startsWith('http') ? img : `${PRODUCT_MEDIA_BASE_URL}${img}`} 
                      alt={`${displayData.title} ${i}`} 
                      layout="fill" 
                      objectFit="contain" 
                    />
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
                      <Image 
                        src={img.startsWith('http') ? img : `${PRODUCT_MEDIA_BASE_URL}${img}`} 
                        alt="thumb" 
                        width={80} 
                        height={80} 
                        objectFit="cover" 
                      />
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
                <span className='CategoryTag'>{displayData.isCombo ? 'Combo Offer' : 'Premium Gear'}</span>
                <h3>{displayData.title}</h3>
                <div className='Stars'>
                    <AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar /><AiFillStar />
                    <span>(48 Reviews)</span>
                </div>
            </div>
            
            <div className='DetailSection'>
                <h4>Description</h4>
                <div 
                  className='ProdDesc ContentText' 
                  dangerouslySetInnerHTML={{ __html: displayData.description }}
                />
            </div>

            {displayData.isCombo && displayData.comboItems.length > 0 && (
              <div className='DetailSection'>
                <h4>Items in this Combo</h4>
                <div className='ComboItemsList'>
                  {displayData.comboItems.map((item, idx) => (
                    <div key={idx} className='ComboMiniItem'>
                      <FiCheck /> <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!displayData.isCombo && Object.keys(displayData.specs).length > 0 && (
              <div className='DetailSection'>
                <h4>Specifications</h4>
                <div className='SpecGrid'>
                  {Object.entries(displayData.specs).map(([key, value]) => (
                    value && (
                      <div className='SpecItem' key={key}>
                        <span>{key}:</span> {value}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Bottom Bar */}
        <div className='PopupFixedBottom'>
          <div className='LeftBrief'>
            <div className='ImgBox'>
                <Image 
                  src={productImages[0].startsWith('http') ? productImages[0] : `${PRODUCT_MEDIA_BASE_URL}${productImages[0]}`} 
                  alt="brief" 
                  width={50} 
                  height={50} 
                />
            </div>
            <div className='Text'>
              <h5>{displayData.title}</h5>
              <p className='PriceRow'>₹{displayData.price} <del>₹{displayData.oldPrice}</del></p>
            </div>
          </div>
          <button 
            className={`PopupCartBtn ${isAdded ? 'added' : ''}`}
            onClick={() => onToggleCart(product.id || product.value)}
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