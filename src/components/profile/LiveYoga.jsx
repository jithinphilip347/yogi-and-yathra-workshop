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
import { resolveMediaUrl } from '@/utils/mediaUrl';

const TABS = ['Upcoming', 'Live Now', 'Completed', 'Cancelled'];

const LiveYoga = ({ sessionsData = [] }) => {
  const [activeTab, setActiveTab] = useState('Upcoming');

  const sessionsList = Array.isArray(sessionsData) ? sessionsData : [];

  const filteredSessions = sessionsList.filter(session => {
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
      default: return { text: 'Upcoming', className: 'status-upcoming' };
    }
  };

  const getActionButton = (session) => {
    const meetingUrl = session.meeting_link || '/live-stream';
    switch(session.status) {
      case 'upcoming': return <Link href={meetingUrl} passHref><button className="ActionBtn primary live-btn"><MdLiveTv style={{ marginRight: '6px' }} /> Join Live</button></Link>;
      case 'ready': return <Link href={meetingUrl} passHref><button className="ActionBtn primary">Join Waiting Room</button></Link>;
      case 'live': return <Link href={meetingUrl} passHref><button className="ActionBtn primary live-btn"><MdLiveTv style={{ marginRight: '6px' }} /> Join Live</button></Link>;
      case 'completed': return <button className="ActionBtn primary outline">Watch Recording</button>;
      case 'expired': return <button className="ActionBtn secondary">View Details</button>;
      case 'cancelled': return <button className="ActionBtn disabled" disabled>Cancelled</button>;
      default: return <Link href={meetingUrl} passHref><button className="ActionBtn primary live-btn"><MdLiveTv style={{ marginRight: '6px' }} /> Join Live</button></Link>;
    }
  };

  return (
    <div className='LiveYoga'>
      
      {/* Top Header & Tabs */}
      <div className="LiveDashboardHeader">
        <div className="TabsContainer">
          {TABS.map(tab => {
            const count = sessionsList.filter(s => {
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
                  <Image src={session.image ? resolveMediaUrl(session.image) : null} alt={session.title} width={150} height={150} className="Thumbnail" />
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
                            <Link href={`/live-stream/${session.id}/${session.slug || 'live-session'}`}>
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
            <div className="EmptyIcon"><MdEvent size={48} color="#9ca3af" /></div>
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