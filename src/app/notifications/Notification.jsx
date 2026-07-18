"use client"
import React, { useState } from 'react';
import { FiClock, FiX, FiCheck } from 'react-icons/fi';
import '@/assets/css/notification.css';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'live_class',
    title: "Today's Daily Class",
    message: "Starts in 30 minutes. Get ready!",
    time: "06:30 PM",
    date: "Today",
    isRead: false,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=200&auto=format&fit=crop", 
  },
  {
    id: 2,
    type: 'course',
    title: "You successfully enrolled",
    message: "Advanced Meditation course is now available in your learning dashboard.",
    time: "10:15 AM",
    date: "Yesterday",
    isRead: true,
    image: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: 3,
    type: 'course',
    title: "New Course",
    message: "Power Yoga Advanced is now live. Check it out!",
    time: "02:00 PM",
    date: "Oct 15",
    isRead: false,
    image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: 4,
    type: 'offer',
    title: "50% OFF on All Courses",
    message: "Festival offer is valid till tomorrow. Grab your favorite courses now.",
    time: "11:00 AM",
    date: "Oct 12",
    isRead: true,
    image: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=200&auto=format&fit=crop",
  }
];

const Notification = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div id='Notification'>
      <div className="container">
        
        <div className="NotificationTopBar">
          {/* <button className="ActionBtn" onClick={markAllAsRead}>
            <FiCheck className="Icon" /> Mark all as read
          </button> */}
        </div>

        <div className="NotificationList">
          {notifications.length > 0 ? (
            <div className="NotifItems">
              {notifications.map(notif => (
                <div className={`NotifCard ${notif.isRead ? 'read' : 'unread'}`} key={notif.id}>
                  
                  <div className="CardLeft">
                    <div className="ImageWrapper">
                      <img src={notif.image} alt={notif.title} />
                    </div>
                    <div className="NotifContent">
                      <h5>{notif.title}</h5>
                      <p>{notif.message}</p>
                    </div>
                  </div>
                  
                  <div className="CardRight">
                    <div className="NotifDateTime">
                      <span>{notif.date}</span>
                      <span className="Time"><FiClock /> {notif.time}</span>
                    </div>

                    <div className="CardActions">
                      <button className="DeleteBtn" onClick={() => deleteNotification(notif.id)} title="Delete Notification">
                        <FiX />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="EmptyState">
              <h3>No notifications yet.</h3>
              <p>You&apos;re all caught up!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Notification;