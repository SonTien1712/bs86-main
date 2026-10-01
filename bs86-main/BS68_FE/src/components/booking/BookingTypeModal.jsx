import React from 'react';
import './BookingTypeModal.css';

export default function BookingTypeModal({ open, onClose, onVisual }) {
    if (!open) return null;

    return (
        <div className='modalOverlay'>
            <div className='modalBox'>
                <div className='modalHeader'>
                    <h2>Chọn hình thức đặt</h2>
                    <button className='closeBtn' onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className='bookingOption green'>
                    <div>
                        <h3>Đặt lịch ngày trực quan</h3>
                        <p>
                            Đặt lịch ngày khi khách chơi nhiều khung giờ, nhiều
                            sân.
                        </p>
                    </div>

                    <button className='goBtn' onClick={onVisual}>
                        →
                    </button>
                </div>

                <div className='bookingOption purple'>
                    <div>
                        <h3>Đặt lịch sự kiện</h3>
                        <p>
                            Sự kiện giúp bạn chơi chung với người cùng đam mê.
                        </p>
                    </div>

                    <button className='goBtn'>→</button>
                </div>
            </div>
        </div>
    );
}
