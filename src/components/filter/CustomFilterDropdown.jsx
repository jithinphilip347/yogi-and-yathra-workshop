"use client";
import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiSearch, FiX, FiCheck } from "react-icons/fi";
import "./CustomFilterDropdown.css";

const CustomFilterDropdown = ({
  icon,
  labelPrefix = "",
  value = "All",
  options = [],
  onChange,
  searchPlaceholder = "Search options...",
  showSearch = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, showSearch]);

  // Normalize options to { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return { value: opt.value, label: opt.label || opt.value };
    }
    return { value: opt, label: opt };
  });

  // Filter options by search term
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Find currently selected label
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption
    ? selectedOption.label
    : value === "All" || value === "default"
    ? labelPrefix
      ? `All ${labelPrefix}s`
      : "All"
    : value;

  const isHighlighted = value !== "All" && value !== "default";

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div
      className={`CustomFilterDropdown ${isOpen ? "open" : ""} ${
        isHighlighted ? "hasValue" : ""
      }`}
      ref={dropdownRef}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className="dropdownTrigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        {icon && <span className="triggerIcon">{icon}</span>}
        <span className="triggerText">
          {labelPrefix && !displayLabel.includes(labelPrefix) && (
            <span className="prefix">{labelPrefix}: </span>
          )}
          {displayLabel}
        </span>
        <FiChevronDown className="chevronIcon" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="customDropdownMenu">
          {/* Internal Search Bar */}
          {showSearch && normalizedOptions.length > 3 && (
            <div className="dropdownSearchBox">
              <FiSearch className="searchIcon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clearSearchBtn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>
          )}

          {/* Scrollable Options List */}
          <ul className="customDropdownList" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`customDropdownItem ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    <span className="itemLabel">{opt.label}</span>
                    {isSelected && <FiCheck className="checkIcon" />}
                  </li>
                );
              })
            ) : (
              <li className="noOptionsMsg">No matching options</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CustomFilterDropdown;

