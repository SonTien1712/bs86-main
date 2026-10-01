import '../../styles/CourtGrid.css'

function CourtGrid({ courts, selectedCourt, onCourtSelect }) {
  return (
    <div className="court-grid-container">
      <h2 className="grid-title">Chọn Sân</h2>
      <div className="court-grid">
        {courts.map((court) => (
          <div
            key={court.id}
            className={`court-card ${selectedCourt === court.id ? 'active' : ''}`}
            onClick={() => onCourtSelect(court.id)}
          >
            <div className="court-name">{court.name}</div>
            <div className="court-type">{court.type}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CourtGrid
