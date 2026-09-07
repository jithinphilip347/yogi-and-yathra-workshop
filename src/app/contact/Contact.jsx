"use client";
import React, { useState } from 'react';
import '../../assets/css/contact.css';
import { FaRegEnvelope, FaPhoneAlt, FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import courseApi from '@/libs/courseApi';
import toast from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitSuccess(false);

    try {
      const response = await courseApi.submitContactEnquiry(formData);
      toast.success(response?.data?.message || "Message sent successfully! We'll get back to you soon.");
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', service: '', message: '' });
      setErrors({});
    } catch (err) {
      console.error('Failed to submit contact enquiry:', err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        toast.error("Please check the form for errors.");
      } else if (err.response?.status === 429) {
        toast.error("Too many attempts. Please wait a minute before submitting again.");
      } else {
        toast.error(err.response?.data?.message || "Failed to send message. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id='Contact'>
      <div className="container">
        
        <div className="ContactHeader">
          <h2>A space to connect and <br/> grow together contact us!</h2>
          <p>Feugiat quam amet vitae netus aliquam donec blandit tellus dictum elementum semper fusce accumsan scelerisque tincidunt ut faucibus quis ut dolor eleifend massa odio porta.</p>
        </div>

        <div className="ContactBody">
          <div className="ContactDetailsWrapper">
            <div className="DetailsInner">
              <h3>More details:</h3>
              <p className="DetailsDesc">Feugiat quam amet vitae netus aliquam donec blandit tellus dictum elementum semper fusce accumsan scelerisque.</p>
              
              <div className="InfoItem">
                <FaRegEnvelope className="InfoIcon" />
                <span>contact@yogastic.com</span>
              </div>
              
              <div className="InfoItem">
                <FaPhoneAlt className="InfoIcon" />
                <span>(584) 391 - 467</span>
              </div>

              <div className="SocialLinks">
                <a href="#"><FaFacebookF /></a>
                <a href="#"><FaInstagram /></a>
                <a href="#"><FaLinkedinIn /></a>
                <a href="#"><FaYoutube /></a>
              </div>
            </div>
          </div>

          <div className="ContactFormWrapper">
            <form onSubmit={handleSubmit} className="ContactForm">
              
              <div className="FormRow">
                <div className="FormGroup">
                  <label>Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="ErrorText">{errors.name}</span>}
                </div>
                
                <div className="FormGroup">
                  <label>Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="ErrorText">{errors.email}</span>}
                </div>
              </div>

              <div className="FormGroup">
                <label>Mobile</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="ErrorText">{errors.phone}</span>}
              </div>

              <div className="FormGroup">
                <label>Message</label>
                <textarea 
                  name="message" 
                  rows="6" 
                  value={formData.message} 
                  onChange={handleChange}
                  className={errors.message ? 'error' : ''}
                ></textarea>
                {errors.message && <span className="ErrorText">{errors.message}</span>}
              </div>

              <button type="submit" className="SubmitBtn" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;