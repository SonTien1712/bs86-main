import '../../styles/BookingSummary.css'

function BookingSummary({ booking }) {
  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' đ'
  }

  return (
    <div className="booking-summary-card">
      <div className="summary-header">
        <h3 className="club-name">Q7 Pickleball Club</h3>
        <p className="club-address">
          Sân tennis Nhà Văn Hoá Phú Nữ, 2 Nguyễn Đông Chi, Tân Phú, Quận 7, Thành phố Hồ Chí Minh
        </p>
      </div>

      <div className="summary-section">
        <h4 className="section-title">Thông tin lịch đặt</h4>
        <div className="info-group">
          <div className="info-row">
            <span className="label">Ngày:</span>
            <span className="value">{booking.date}</span>
          </div>
          <div className="info-row">
            <span className="label">Sân:</span>
            <span className="value">{booking.courtName}</span>
          </div>
          <div className="info-row">
            <span className="label">Thời gian:</span>
            <span className="value">{booking.startTime} - {booking.endTime}</span>
          </div>
          <div className="info-row">
            <span className="label">Loại hình:</span>
            <span className="value">{booking.sport}</span>
          </div>
          <div className="info-row">
            <span className="label">Thời lượng:</span>
            <span className="value">{booking.duration} phút</span>
          </div>
        </div>
      </div>

      <div className="summary-section">
        <h4 className="section-title">Ưu đãi</h4>
        <button className="offer-button">Chọn ưu đãi áp dụng +</button>
      </div>

      <div className="price-section">
        <div className="price-row">
          <span className="price-label">Số tiền cần thanh toán</span>
          <span className="price-value">{formatPrice(booking.price)}</span>
        </div>
      </div>

      <div className="additional-info">
        <div className="info-block">
          <h5>TÊN CỦA BẠN</h5>
          <p>Nguyễn Hiếu Thuận</p>
        </div>
        <div className="info-block">
          <h5>SỐ ĐIỆN THOẠI</h5>
          <p>+84 • Nhập số điện thoại</p>
        </div>
      </div>
    </div>
  )
}

export default BookingSummary
