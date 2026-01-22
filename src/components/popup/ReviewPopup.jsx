// ReviewPopup.jsx
import { FiX, FiStar } from 'react-icons/fi';

const ReviewPopup = ({ onClose }) => (
  <div className='PopupOverlay'>
    <div className='PopupContent ReviewContainer'>
      <div className='PopupHeader'>
        <h3>All Student Reviews</h3>
        <FiX onClick={onClose} className='CloseBtn' />
      </div>
      <div className='PopupBody Scrollable'>
        {/* Map through all reviews here */}
        <div className='ReviewItem'>... Same structure as SingleReview ...</div>
      </div>
    </div>
  </div>
);
export default ReviewPopup;