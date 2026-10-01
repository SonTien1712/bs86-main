import '../../styles/Calendar.css'

function Calendar({ selectedDate, onDateChange }) {
  const handlePrevDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    onDateChange(date.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    onDateChange(date.toISOString().split('T')[0])
  }

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0])
  }

  return (
    <div className="calendar-container">
      <button className="nav-button prev" onClick={handlePrevDay}>
        &larr;
      </button>
      
      <div className="calendar-display">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="date-input"
        />
        <button className="today-button" onClick={handleToday}>
          Today
        </button>
      </div>

      <button className="nav-button next" onClick={handleNextDay}>
        &rarr;
      </button>
    </div>
  )
}

export default Calendar
