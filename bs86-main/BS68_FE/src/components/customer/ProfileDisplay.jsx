import './ProfileDisplay.css'

const SPORT_LABELS = {
  Football: 'Bóng đá',
  FOOTBALL: 'Bóng đá',
  Basketball: 'Bóng rổ',
  BASKETBALL: 'Bóng rổ',
  Tennis: 'Tennis',
  TENNIS: 'Tennis',
  Cricket: 'Cricket',
  CRICKET: 'Cricket',
  Swimming: 'Bơi lội',
  SWIMMING: 'Bơi lội',
  Badminton: 'Cầu lông',
  BADMINTON: 'Cầu lông',
  Golf: 'Golf',
  GOLF: 'Golf',
  Cycling: 'Đạp xe',
  CYCLING: 'Đạp xe',
}

const LEVEL_LABELS = {
  Beginner: 'Mới bắt đầu',
  BEGINNER: 'Mới bắt đầu',
  Intermediate: 'Trung cấp',
  INTERMEDIATE: 'Trung cấp',
  Advanced: 'Nâng cao',
  ADVANCED: 'Nâng cao',
  Professional: 'Chuyên nghiệp',
  PROFESSIONAL: 'Chuyên nghiệp',
}

function translateSport(value) {
  return SPORT_LABELS[value] || value || 'Chưa cập nhật'
}

function translateLevel(value) {
  return LEVEL_LABELS[value] || value || 'Chưa cập nhật'
}

export default function ProfileDisplay({ profile, onEdit, isReadOnly }) {
  if (!profile) {
    return (
      <div className="profile-display empty-state">
        <div className="empty-message-box">
          <div className="empty-icon-wrapper">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
             </svg>
          </div>
          <h3>Chưa có dữ liệu hồ sơ</h3>
          <p>Hồ sơ của người dùng này chưa được thiết lập.</p>
        </div>
        {!isReadOnly && (
          <button onClick={onEdit} className="btn-create-profile">
            Tạo hồ sơ ngay
          </button>
        )}
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  const fullName = profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Người dùng'
  const location = profile.location || 'Việt Nam'
  const level = translateLevel(profile.sportLevel || profile.level)
  const sport = translateSport(profile.sportPreference)

  return (
    <div className="profile-display glass-card">
      <div className="profile-hero">
          <div className="hero-background"></div>

          <div className="profile-header-content">
            <div className="avatar-wrapper">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={fullName} className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  <span>{(fullName || 'U').charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="profile-identity">
              <h2>{fullName}</h2>
              <p className="profile-tagline">{level} • {location}</p>
            </div>

            {!isReadOnly && (
                <button onClick={onEdit} className="btn-edit-floating">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  Chỉnh sửa
                </button>
            )}
          </div>
      </div>

      <div className="profile-grid">
        <div className="info-card">
            <div className="info-card-header">
                <div className="icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                </div>
                <h3>Thông tin liên hệ</h3>
            </div>
            <div className="info-list">
                <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{profile.email || 'Không có'}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Số điện thoại</span>
                    <span className="info-value">{profile.phoneNumber || profile.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Ngày sinh</span>
                    <span className="info-value">{formatDate(profile.dateOfBirth)}</span>
                </div>
            </div>
        </div>

        <div className="info-card">
            <div className="info-card-header">
                <div className="icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                </div>
                <h3>Địa điểm & hoạt động</h3>
            </div>
            <div className="info-list">
                <div className="info-item">
                    <span className="info-label">Địa chỉ</span>
                    <span className="info-value">{profile.address || 'Chưa cập nhật'}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Khu vực sinh sống</span>
                    <span className="info-value">{location || 'Chưa cập nhật'}</span>
                </div>
            </div>
        </div>

        <div className="info-card sport-card">
            <div className="info-card-header">
                <div className="icon-box highlight">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                </div>
                <h3>Sở thích thể thao</h3>
            </div>
            <div className="info-list">
                <div className="info-item">
                    <span className="info-label">Môn thể thao</span>
                    <span className="info-value badge-primary">{sport}</span>
                </div>
                <div className="info-item">
                    <span className="info-label">Trình độ</span>
                    <span className="info-value badge-secondary">{level}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
