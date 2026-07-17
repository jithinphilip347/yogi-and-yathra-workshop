"use client";
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaLock, FaGlobe, FaChevronDown, FaCheckCircle, FaSearch } from 'react-icons/fa';
import { SiRazorpay } from 'react-icons/si';
import '../../assets/css/checkout.css'; 

const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'AU', label: 'Australia' }
];

const STATES = {
  'IN': [
    { value: 'KL', label: 'Kerala' },
    { value: 'KA', label: 'Karnataka' },
    { value: 'TN', label: 'Tamil Nadu' },
    { value: 'MH', label: 'Maharashtra' },
    { value: 'DL', label: 'Delhi' }
  ],
  'US': [
    { value: 'NY', label: 'New York' },
    { value: 'CA', label: 'California' },
    { value: 'TX', label: 'Texas' }
  ]
};

const CustomDropdown = ({ options, value, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLabel = value ? options.find(o => o.value === value)?.label : placeholder;

  return (
    <div className="CustomDropdownWrapper" ref={dropdownRef}>
      <div className={`DropdownHeader ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        {icon && <span className="IconLeft">{icon}</span>}
        <span className="SelectedText" style={{ marginLeft: icon ? '28px' : '0' }}>{selectedLabel}</span>
        <FaChevronDown className={`IconRight ${isOpen ? 'open' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="DropdownListContainer">
          <div className="SearchBox">
            <FaSearch className="SearchIcon" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="DropdownList">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <li 
                  key={opt.value} 
                  className={opt.value === value ? 'selected' : ''} 
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {opt.label}
                </li>
              ))
            ) : (
              <li className="NoResults">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [selectedState, setSelectedState] = useState('KL');

  const handleCountryChange = (val) => {
    setSelectedCountry(val);
    const newStates = STATES[val] || [];
    if (newStates.length > 0) {
      setSelectedState(newStates[0].value);
    } else {
      setSelectedState('');
    }
  };

  const stateOptions = STATES[selectedCountry] || [];

  return (
    <div id='Checkout'>
      <div className="CheckoutContainer">
        
        {/* Left Column */}
        <div className="CheckoutLeft">

          {/* Billing Address */}
          <section className="CheckoutSection">
            <h2 className="SectionTitle">Billing address</h2>
            <div className="FormRow">
              <div className="FormGroup">
                <label>Country</label>
                <CustomDropdown 
                  options={COUNTRIES}
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  placeholder="Select Country"
                  icon={<FaGlobe />}
                />
              </div>
              <div className="FormGroup">
                <label>State / Union Territory</label>
                <CustomDropdown 
                  options={stateOptions.length > 0 ? stateOptions : [{value: '', label: 'N/A'}]}
                  value={selectedState}
                  onChange={setSelectedState}
                  placeholder="Select State"
                />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="CheckoutSection">
            <div className="PaymentHeader">
              <h2 className="SectionTitle">Payment method</h2>
            </div>

            <div className="PaymentGrid">
              {/* UPI */}
              <div className={`PaymentBox ${paymentMethod === 'upi' ? 'active' : ''}`} onClick={() => setPaymentMethod('upi')}>
                <div className="BoxIcon">
                  <span style={{fontWeight: 800, fontStyle: 'italic', fontSize: '18px'}}>UPI</span>
                </div>
                <span className="BoxName">UPI Payment</span>
                {paymentMethod === 'upi' && <FaCheckCircle className="CheckIcon" />}
              </div>

              {/* Razorpay */}
              <div className={`PaymentBox ${paymentMethod === 'razorpay' ? 'active' : ''}`} onClick={() => setPaymentMethod('razorpay')}>
                <div className="BoxIcon">
                  <SiRazorpay style={{fontSize: '20px', color: '#3395FF'}} />
                </div>
                <span className="BoxName">Razorpay</span>
                {paymentMethod === 'razorpay' && <FaCheckCircle className="CheckIcon" />}
              </div>
            </div>
            
            {paymentMethod === 'upi' && (
              <div className="PaymentHelperText">
                <p>After generating the QR code you can use your preferred UPI app to complete the payment.</p>
                <p>Click the &quot;Continue&quot; button to generate a QR code for UPI payment.</p>
              </div>
            )}
            {paymentMethod === 'razorpay' && (
              <div className="PaymentHelperText">
                <p>You will be redirected to Razorpay to complete your purchase securely.</p>
              </div>
            )}
          </section>

        </div>

        {/* Right Column - Summary */}
        <div className="CheckoutRight">
          <div className="SummaryCard">
            <h2 className="SummaryTitle">Order summary</h2>
            
            <div className="SummaryRow">
              <span>Original Price:</span>
              <span>₹3,998.00</span>
            </div>
            <div className="SummaryRow">
              <span>Discounts (75% Off):</span>
              <span>-₹3,000.00</span>
            </div>

            <hr className="Divider" />

            <div className="SummaryRow">
              <span><strong>Subtotal:</strong></span>
              <span><strong>₹998.00</strong></span>
            </div>
            <div className="SummaryRow">
              <span>GST (18%):</span>
              <span>+₹179.64</span>
            </div>

            <hr className="Divider" />

            <div className="SummaryRow TotalRow">
              <span>Total:</span>
              <span>₹1,177.64</span>
            </div>
            
            <button className="ProceedBtn">
              Continue
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
export default Checkout;