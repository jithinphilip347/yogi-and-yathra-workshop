"use client";
import React from "react";
import { FiChevronDown, FiX } from "react-icons/fi";

const FilterBox = ({ 
  category, setCategory, categoryOpen, setCategoryOpen, categoryRef,
  level, setLevel, price, setPrice, isMobile = false, onClose 
}) => {
  return (
    <aside className={`CourseFilter ${isMobile ? "MobileDrawer" : ""}`}>
      <div className="FilterHeader">
        <h3 className="FilterTitle">Filters</h3>
        {isMobile && <FiX className="CloseIcon" onClick={onClose} />}
      </div>

      <div className="FilterBlock">
        <label>Category</label>
        <div className="CustomDropdown" ref={categoryRef} onClick={() => setCategoryOpen(!categoryOpen)}>
          <span>{category}</span>
          <FiChevronDown />
          {categoryOpen && (
            <ul className="DropdownList">
              {["All", "Yoga", "Fitness", "Meditation"].map((item) => (
                <li key={item} onClick={() => setCategory(item)}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="FilterBlock">
        <label>Course Level</label>
        <div className="RadioGroup">
          {["Beginner", "Mid Level"].map((l) => (
            <label key={l} className="RadioItem">
              <input type="radio" name={isMobile ? "level-mob" : "level"} value={l.toLowerCase()} onChange={(e) => setLevel(e.target.value)} />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="FilterBlock">
        <label>Price Range</label>
        <input type="range" min="0" max="1000" value={price} onChange={(e) => setPrice(e.target.value)} className="PriceSlider" />
        <div className="PriceInputs">
          <div className="InputBox">
            <small>Min</small>
            <input type="number" value="0" disabled />
          </div>
          <div className="InputBox">
            <small>Max</small>
            <input type="number" value={price} readOnly />
          </div>
        </div>
      </div>

      <div className="FilterButtons">
        <button className="CancelBtn">Reset</button>
        <button className="ApplyBtn" onClick={onClose}>Apply Filters</button>
      </div>
    </aside>
  );
};

export default FilterBox;