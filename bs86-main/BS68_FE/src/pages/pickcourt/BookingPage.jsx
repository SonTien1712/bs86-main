import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Calendar from '../../components/pickcourt/Calendar'
import CourtGrid from '../../components/pickcourt/CourtGrid'
import TimeSlotPicker from '../../components/pickcourt/TimeSlotPicker'
import '../../styles/BookingPage.css'

function BookingPage({ setBookingData }) {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [selectedSlots, setSelectedSlots] = useState([])
  const [courts, setCourts] = useState([
    { id: 1, name: 'Sân 1', type: 'Pickleball' },
    { id: 2, name: 'Sân 2', type: 'Pickleball' },
    { id: 3, name: 'Sân 3', type: 'Pickleball' },
    { id: 4, name: 'Sân 4', type: 'Pickleball' },
    { id: 5, name: 'Sân 5', type: 'Pickleball' },
    { id: 6, name: 'Sân 6', type: 'Pickleball' },
    { id: 7, name: 'Sân 7', type: 'Pickleball' },
    { id: 8, name: 'Sân 8', type: 'Pickleball' },
    { id: 9, name: 'Tennis', type: 'Tennis' },
  ])

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setSelectedSlots([])
  }

  const handleCourtSelect = (courtId) => {
    setSelectedCourt(courtId)
    setSelectedSlots([])
  }

  const handleSlotSelect = (slots) => {
    setSelectedSlots(slots)
  }

  const handleContinue = () => {
    if (selectedCourt && selectedSlots.length > 0) {
      const court = courts.find(c => c.id === selectedCourt)
      const startTime = selectedSlots[0]
      const endTime = selectedSlots[selectedSlots.length - 1]
      const duration = selectedSlots.length * 30

      const bookingInfo = {
        courtId: selectedCourt,
        courtName: court.name,
        date: selectedDate,
        startTime: startTime,
        endTime: `${parseInt(endTime.split(':')[0]) + 1}:${endTime.split(':')[1]}`,
        duration: duration,
        sport: court.type,
        price: duration === 30 ? 75000 : duration === 60 ? 150000 : 225000,
      }

      setBookingData(bookingInfo)
      navigate('/payment', { state: { booking: bookingInfo } })
    }
  }

  return (
    <div className="booking-page">
      <header className="booking-header">
        <button className="back-button">‹</button>
        <h1>Đặt lịch ngày trực quan</h1>
        <div className="date-display">{selectedDate}</div>
      </header>

      <div className="booking-content">
        <div className="section-tabs">
          <button className="tab active">Trống</button>
          <button className="tab">Đã đặt</button>
          <button className="tab">Khóa</button>
          <button className="tab">Sự kiện</button>
          <button className="tab tab-special">Xem sân & bảng giá</button>
        </div>

        <Calendar selectedDate={selectedDate} onDateChange={handleDateChange} />

        <CourtGrid
          courts={courts}
          selectedCourt={selectedCourt}
          onCourtSelect={handleCourtSelect}
        />

        {selectedCourt && (
          <TimeSlotPicker
            date={selectedDate}
            courtId={selectedCourt}
            selectedSlots={selectedSlots}
            onSlotSelect={handleSlotSelect}
          />
        )}

        {selectedCourt && selectedSlots.length > 0 && (
          <div className="booking-summary">
            <div className="summary-item">
              <strong>Sân:</strong> {courts.find(c => c.id === selectedCourt)?.name}
            </div>
            <div className="summary-item">
              <strong>Ngày:</strong> {selectedDate}
            </div>
            <div className="summary-item">
              <strong>Thời gian:</strong> {selectedSlots[0]} - {selectedSlots[selectedSlots.length - 1]}
            </div>
            <div className="summary-item">
              <strong>Giá:</strong> {selectedSlots.length * 75000}.000 đ
            </div>
            <button className="continue-button" onClick={handleContinue}>
              Tiếp theo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookingPage
