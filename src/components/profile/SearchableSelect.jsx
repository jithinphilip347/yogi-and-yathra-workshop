"use client";
import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiSearch, FiCheck } from "react-icons/fi";

export const HEALTH_ISSUES_OPTIONS = [
  "Cholesterol",
  "Sugar",
  "BP",
  "Asthma",
  "Heart Issues",
  "Back pain",
  "Knee Pain",
  "Anxiety",
  "Stress",
  "None, No Issues.",
  "Other:",
];

const SearchableSelect = ({
  options = HEALTH_ISSUES_OPTIONS,
  value,
  onChange,
  placeholder = "Select an Issue",
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="CustomSearchDropdown" ref={dropdownRef}>
      <div
        className={`DropdownTrigger ${isOpen ? "open" : ""} ${hasError ? "error-border" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
      >
        <span className={value ? "SelectedText" : "PlaceholderText"}>
          {value || placeholder}
        </span>
        <FiChevronDown className={`ArrowIcon ${isOpen ? "rotated" : ""}`} />
      </div>

      {isOpen && (
        <div
          className="DropdownMenu"
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="SearchBox">
            <FiSearch className="SearchIcon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search health issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div
            className="OptionsList"
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            onWheel={(e) => e.stopPropagation()}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <div
                    key={opt}
                    className={`OptionItem ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                  >
                    <span>{opt}</span>
                    {isSelected && <FiCheck className="CheckIcon" />}
                  </div>
                );
              })
            ) : (
              <div className="NoOptions">No matching issue found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

