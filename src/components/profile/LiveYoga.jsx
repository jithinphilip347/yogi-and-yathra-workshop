"use client";

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
import { FiAward, FiDownload, FiCheck, FiLoader } from 'react-icons/fi';
import Link from 'next/link';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import courseApi from '@/libs/courseApi';
import CertificateViewerModal from '@/components/certificate/CertificateViewerModal';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const TABS = ['Upcoming', 'Live Now', 'Completed', 'Cancelled'];

const LiveYoga = ({ sessionsData = [] }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Upcoming');

  // Certificate Viewer Modal State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [activeEntity, setActiveEntity] = useState(null);

  // Per-session certificate state cache and loading state
  const [eligibilityMap, setEligibilityMap] = useState({});
  const [loadingActionMap, setLoadingActionMap] = useState({});

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

  /**
   * Authoritative Certificate Action Handler
   * Evaluates eligibility from backend, claims if eligible, or opens the viewer if already issued.
   */
  const handleCertificateAction = async (session) => {
    if (!session?.id) return;

    if (loadingActionMap[session.id]) {
      return; // prevent duplicate clicks
    }

    setLoadingActionMap(prev => ({ ...prev, [session.id]: true }));

    try {
      // 1. Authoritative Eligibility Check
      const eligRes = await courseApi.getLiveSectionCertificateEligibility(session.id);
      const data = eligRes.data?.data || eligRes.data;

      setEligibilityMap(prev => ({ ...prev, [session.id]: data }));

      if (!data?.has_certificate) {
        toast.error(data?.reason || 'Certificate is not configured for this live session.');
        setLoadingActionMap(prev => ({ ...prev, [session.id]: false }));
        return;
      }

      // 2. Already Claimed -> Open Viewer directly
      if (data?.is_claimed && data?.certificate) {
        setSelectedCertificate(data.certificate);
        setActiveEntity(session);
        setIsViewerOpen(true);
        setLoadingActionMap(prev => ({ ...prev, [session.id]: false }));
        return;
      }

      // 3. Eligible -> Claim Certificate
      if (data?.eligible) {
        const claimRes = await courseApi.claimLiveSectionCertificate(session.id);
        const certPayload = claimRes.data?.data || claimRes.data;

        toast.success(claimRes.data?.message || 'Certificate claimed successfully!');

        // Update local eligibility cache
        setEligibilityMap(prev => ({
          ...prev,
          [session.id]: {
            ...data,
            is_claimed: true,
            status: 'issued',
            certificate: certPayload,
          }
        }));

        // Invalidate relevant queries
        try {
          queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
          queryClient.invalidateQueries({ queryKey: ['certificates'] });
        } catch (_) {}

        setSelectedCertificate(certPayload);
        setActiveEntity(session);
        setIsViewerOpen(true);
      } else {
        // 4. Not Eligible -> Display authoritative reason
        toast.error(data?.reason || 'You are not currently eligible for this certificate.');
      }
    } catch (err) {
      console.error('Certificate claim/view error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to process certificate request.';
      toast.error(errorMsg);
    } finally {
      setLoadingActionMap(prev => ({ ...prev, [session.id]: false }));
    }
  };

  const getActionButton = (session) => {
    const meetingUrl = session.meeting_link || '/live-stream';
    const isActionLoading = Boolean(loadingActionMap[session.id]);
    const cachedElig = eligibilityMap[session.id];

    switch(session.status) {
      case 'upcoming': return <Link href={meetingUrl} passHref><button className="ActionBtn primary live-btn"><MdLiveTv style={{ marginRight: '6px' }} /> Join Live</button></Link>;
      case 'ready': return <Link href={meetingUrl} passHref><button className="ActionBtn primary">Join Waiting Room</button></Link>;
      case 'live': return <Link href={meetingUrl} passHref><button className="ActionBtn primary live-btn"><MdLiveTv style={{ marginRight: '6px' }} /> Join Live</button></Link>;
      case 'completed': 
      case 'expired':
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {session.status === 'completed' && (
              <button className="ActionBtn primary outline">Watch Recording</button>
            )}
            <button 
              className="ActionBtn secondary"
              onClick={() => handleCertificateAction(session)}
              disabled={isActionLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <FiAward style={{ fontSize: '15px' }} />
              <span>
                {isActionLoading 
                  ? 'Processing...' 
                  : (cachedElig?.is_claimed ? 'View Certificate' : 'Certificate')}
              </span>
            </button>
          </div>
        );
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
            const isActionLoading = Boolean(loadingActionMap[session.id]);
            const cachedElig = eligibilityMap[session.id];
            
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
                            <button 
                              onClick={() => handleCertificateAction(session)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading
                                ? 'Checking Certificate...'
                                : (cachedElig?.is_claimed ? 'View / Download Certificate' : 'Claim Certificate')}
                            </button>
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

      {/* Reused Certificate Viewer Modal */}
      <CertificateViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedCertificate(null);
          setActiveEntity(null);
        }}
        certificate={selectedCertificate}
        entity={activeEntity}
      />

    </div>
  )
}

export default LiveYoga;