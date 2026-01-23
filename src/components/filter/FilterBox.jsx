"use client";
import React, { useEffect } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";

const FilterBox = ({ 
  category, setCategory, categoryOpen, setCategoryOpen, categoryRef,
  level, setLevel, price, setPrice, isMobile = false, onClose, categories = [] 
}) => {
  const handleReset = () => {
    setCategory("All");
    setLevel("");
    setPrice(5000);
    if(isMobile) onClose();
  };

  const getCategoryDisplay = () => {
    if (category === "All") return "All Categories";
    const found = categories.find(c => c.id === category);
    return found ? found.name : "All Categories";
  };

  return (
    <aside className={`CourseFilter ${isMobile ? "MobileDrawer" : ""}`}>
      <div className="FilterHeader">
        <h3 className="FilterTitle">Filters</h3>
        {isMobile && <FiX className="CloseIcon" onClick={onClose} />}
      </div>

      <div className="FilterBlock">
        <label>Category</label>
        <div className="CustomDropdown" ref={categoryRef} onClick={() => setCategoryOpen(!categoryOpen)}>
          <span>{getCategoryDisplay()}</span>
          <FiChevronDown />
          {categoryOpen && (
            <ul className="DropdownList">
              <li onClick={(e) => {
                e.stopPropagation();
                setCategory("All");
                setCategoryOpen(false);
              }}>All Categories</li>
              {categories.map((item) => (
                <li key={item.id} onClick={(e) => {
                  e.stopPropagation();
                  setCategory(item.id);
                  setCategoryOpen(false);
                }}>{item.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="FilterBlock">
        <label>Course Level</label>
        <div className="RadioGroup">
          {["Beginner", "Intermediate", "Advanced"].map((l) => (
            <label key={l} className="RadioItem">
              <input 
                type="radio" 
                name={isMobile ? "level-mob" : "level"} 
                value={l.toLowerCase()} 
                checked={level === l.toLowerCase()}
                onChange={(e) => setLevel(e.target.value)} 
              />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="FilterBlock">
        <label>Price Range</label>
        <div className="PriceRangeHeader">
          <span>₹ 0 - ₹ {price}</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="5000" 
          step="100"
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
          className="PriceSlider" 
        />
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
        <button className="CancelBtn" onClick={handleReset}>Reset</button>
        <button className="ApplyBtn" onClick={() => onClose && onClose()}>Apply Filters</button>
      </div>
    </aside>
  );
};

export default FilterBox;