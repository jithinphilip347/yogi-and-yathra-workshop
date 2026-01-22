// VideoPreviewPopup.jsx
import { FiX } from 'react-icons/fi';

const VideoPreviewPopup = ({ onClose }) => (
  <div className='PopupOverlay'>
    <div className='PopupContent VideoContainer'>
      <FiX onClick={onClose} className='CloseBtn' />
      <div className='VideoWrapper'>
        <iframe width="100%" height="400" src="https://www.youtube.com/embed/your-video-id" title="Course Preview" frameBorder="0" allowFullScreen></iframe>
      </div>
      <div className='VideoInfo'>
        <h4>Course Preview: Introduction</h4>
        <p>Get a glimpse of what you will learn in this bootcamp.</p>
      </div>
    </div>
  </div>
);
export default VideoPreviewPopup;