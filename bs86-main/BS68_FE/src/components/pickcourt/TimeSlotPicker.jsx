import { useState, useEffect } from 'react'
import '../../styles/TimeSlotPicker.css'

function TimeSlotPicker({ date, courtId, selectedSlots, onSlotSelect }) {
  const [timeSlots, setTimeSlots] = useState([])
  const [bookedSlots, setBookedSlots] = useState(new Set())

  useEffect(() => {
    // Generate time slots from 6:00 to 22:30 in 30-minute intervals
    const slots = []
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute of [0, 30]) {
        if (hour === 22 && minute > 0) break
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    setTimeSlots(slots)

    // Mock booked slots (in production, fetch from API)
    const mockBooked = new Set(['08:00', '08:30', '09:00', '17:00', '17:30', '20:00', '20:30', '21:00'])
    setBookedSlots(mockBooked)
  }, [date, courtId])

  const handleSlotClick = (time) => {
    if (bookedSlots.has(time)) return

    let newSlots = [...selectedSlots]
    const timeIndex = timeSlots.indexOf(time)

    if (newSlots.includes(time)) {
      newSlots = newSlots.filter(s => s !== time)
    } else {
      // Check if we can add continuous slot
      if (newSlots.length === 0) {
        newSlots = [time]
      } else {
        const lastSlot = newSlots[newSlots.length - 1]
        const lastIndex = timeSlots.indexOf(lastSlot)
        if (timeIndex === lastIndex + 1) {
          newSlots.push(time)
        } else if (timeIndex === lastIndex - 1) {
          newSlots.unshift(time)
        } else {
          newSlots = [time]
        }
      }
    }

    onSlotSelect(newSlots)
  }

  return (
    <div className="time-slot-picker">
      <h2 className="picker-title">Chọn Thời Gian</h2>
      <div className="time-slots-container">
        {timeSlots.map((time) => {
          const isBooked = bookedSlots.has(time)
          const isSelected = selectedSlots.includes(time)
          const isAdjacent = selectedSlots.length > 0 && (
            timeSlots.indexOf(time) === timeSlots.indexOf(selectedSlots[selectedSlots.length - 1]) + 1 ||
            timeSlots.indexOf(time) === timeSlots.indexOf(selectedSlots[0]) - 1
          )

          return (
            <button
              key={time}
              className={`time-slot ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''} ${isAdjacent && !isSelected ? 'adjacent' : ''}`}
              onClick={() => handleSlotClick(time)}
              disabled={isBooked}
            >
              {time}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TimeSlotPicker
