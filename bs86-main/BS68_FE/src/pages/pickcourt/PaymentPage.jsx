import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import BookingSummary from '../../components/pickcourt/BookingSummary'
import PersonalInfoForm from '../../components/pickcourt/PersonalInfoForm'
import '../../styles/PaymentPage.css'

function PaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const booking = location.state?.booking || {}
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    paymentMethod: 'cash',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFormChange = (data) => {
    setFormData(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate form
      if (!formData.customerName || !formData.customerPhone || !formData.customerEmail) {
        throw new Error('Vui lòng điền đủ thông tin')
      }

      // In production, call the API
      // const response = await bookingAPI.createBooking({
      //   ...booking,
      //   ...formData,
      // })

      // Mock success response
      setTimeout(() => {
        alert('Đặt lịch thành công! Mã đặt lịch: #' + Math.random().toString(36).substr(2, 9).toUpperCase())
        navigate('/')
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!booking.courtName) {
    return (
      <div className="payment-page">
        <div className="no-booking">
          <p>Không có đặt lịch nào được chọn</p>
          <button onClick={() => navigate('/')}>Quay lại</button>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-page">
      <header className="payment-header">
        <button className="back-button" onClick={() => navigate('/')}>‹</button>
        <h1>Xác nhận & Thanh toán</h1>
      </header>

      <div className="payment-content">
        <div className="payment-section">
          <h2>Thông tin lịch đặt</h2>
          <BookingSummary booking={booking} />
        </div>

        <div className="payment-section">
          <h2>Thông tin cá nhân</h2>
          {error && <div className="error-message">{error}</div>}
          <PersonalInfoForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
