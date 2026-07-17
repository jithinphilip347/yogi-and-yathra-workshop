import React, { useState } from 'react';
import Image from 'next/image';
import { 
  MdEvent, 
  MdAccessTime, 
  MdLiveTv, 
  MdCheckCircle, 
  MdCancel,
  MdKeyboardArrowRight,
  MdMoreVert,
  MdLock
} from 'react-icons/md';
import { FaChalkboardTeacher } from 'react-icons/fa';
import Link from 'next/link';

import LiveImg1 from '../../assets/images/live1.webp';
import LiveImg2 from '../../assets/images/live2.webp';
import LiveImg3 from '../../assets/images/live3.webp';
import LiveImg4 from '../../assets/images/live4.webp';
import CourseImg1 from '../../assets/images/courseImg-1.webp';
import CourseImg2 from '../../assets/images/courseImg-2.webp';

// Mock Data
const MOCK_SESSIONS = [
  {
    id: 'LS1024',
    title: 'Advanced Vinyasa Flow',
    instructor: 'Sarah Jenkins',
    date: '25 Oct 2026',
    time: '07:00 AM - 08:30 AM',
    duration: '90 Min',
    category: 'Yoga',
    status: 'upcoming', 
    countdown: 'Starts in 2 Days',
    image: LiveImg1,
  }
];

const TABS = ['Upcoming', 'Live Now', 'Completed', 'Cancelled'];

const LiveYoga = () => {
  const [activeTab, setActiveTab] = useState('Upcoming');

  const filteredSessions = MOCK_SESSIONS.filter(session => {
    // Filter by Tab
    if (activeTab === 'Upcoming' && !['upcoming', 'ready'].includes(session.status)) return false;
    if (activeTab === 'Live Now' && session.status !== 'live') return false;
    if (activeTab === 'Completed' && !['completed', 'expired'].includes(session.status)) return false;
    if (activeTab === 'Cancelled' && session.status !== 'cancelled') return false;

    return true;
  });

  const getStatusDisplay = (session) => {
    switch(session.status) {
      case 'upcoming': return { text: 'Upcoming', className: 'status-upcoming' };
      case 'ready': return { text: 'Ready to Join', className: 'status-ready' };
      case 'live': return { text: 'LIVE NOW', className: 'status-live' };
      case 'completed': return { text: 'Completed', className: 'status-completed' };
      case 'expired': return { text: 'Recording Expired', className: 'status-expired' };
      case 'cancelled': return { text: 'Cancelled', className: 'status-cancelled' };
      default: return { text: '', className: '' };
    }
  };

  const getActionButton = (session) => {
    switch(session.status) {
      case 'upcoming': return <button className="ActionBtn disabled" disabled>Available 30 Min Before <MdLock style={{ marginLeft: '6px' }}/></button>;
      case 'ready': return <button className="ActionBtn primary">Join Waiting Room</button>;
      case 'live': return <button className="ActionBtn primary live-btn">🔴 Join Live</button>;
      case 'completed': return <button className="ActionBtn primary outline">Watch Recording</button>;
      case 'expired': return <button className="ActionBtn secondary">View Details</button>;
      case 'cancelled': return <button className="ActionBtn disabled" disabled>Cancelled</button>;
      default: return null;
    }
  };

  return (
    <div className='LiveYoga'>
      
      {/* Top Header & Tabs */}
      <div className="LiveDashboardHeader">
        <div className="TabsContainer">
          {TABS.map(tab => {
            const count = MOCK_SESSIONS.filter(s => {
              if (tab === 'Upcoming') return ['upcoming', 'ready'].includes(s.status);
              if (tab === 'Live Now') return s.status === 'live';
              if (tab === 'Completed') return ['completed', 'expired'].includes(s.status);
              if (tab === 'Cancelled') return s.status === 'cancelled';
              return false;
            }).length;

            return (
              <button 
                key={tab} 
                className={`TabBtn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab} <span>({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Session List */}
      <div className="SessionsList">
        {filteredSessions.length > 0 ? (
          filteredSessions.map(session => {
            const statusInfo = getStatusDisplay(session);
            
            return (
              <div key={session.id} className="SessionCard">
                
                <div className="ThumbnailWrapper">
                  <Image src={session.image} alt={session.title} width={150} height={150} className="Thumbnail" />
                </div>

                <div className="SessionDetails">
                  <div className="CardHeader">
                    <div className="TitleArea">
                      <span className={`StatusBadge ${statusInfo.className}`}>
                        {session.status === 'live' && <span className="LiveDot"></span>}
                        {statusInfo.text} {session.countdown && ` • ${session.countdown}`}
                      </span>
                      <h3 className="Title">{session.title}</h3>
                    </div>
                    
                    <div className="MoreMenuWrapper">
                      <MdMoreVert className="MoreIcon" />
                      <div className="DropdownMenu">
                        {['upcoming', 'ready'].includes(session.status) && (
                          <>
                            <Link href="/live-yoga-class">
                              <button>View Details</button>
                            </Link>
                            <button>Download Invoice</button>
                            <button className="danger">Cancel Booking</button>
                          </>
                        )}
                        {['completed', 'expired'].includes(session.status) && (
                          <>
                            <button>Watch Recording</button>
                            <button>Download Certificate</button>
                            <button>Rate Session</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="InfoGrid">
                    <span className="InfoItem"><MdEvent/> {session.date}</span>
                    <span className="InfoItem"><MdAccessTime/> {session.time}</span>
                    <span className="InfoItem"><FaChalkboardTeacher/> {session.instructor}</span>
                  </div>

                  <div className="CardFooter">
                    <div className="FooterLeft">
                      <div className="BookingId">ID: #{session.id}</div>
                    </div>
                    
                    <div className="FooterRight">
                      {getActionButton(session)}
                    </div>
                  </div>
                </div>

              </div>
            )
          })
        ) : (
          <div className="EmptyState">
            <div className="EmptyIcon">🧘‍♀️</div>
            <h3>No Live Sessions Yet</h3>
            <p>Book your first live yoga session.</p>
            <button className="ExploreBtn">Explore Live Sessions</button>
          </div>
        )}
      </div>

    </div>
  )
}

export default LiveYoga;