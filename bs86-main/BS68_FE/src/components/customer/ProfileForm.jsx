import AvatarUpload from './AvatarUpload'
import FormField from './FormField'
import './ProfileForm.css'

const SPORTS = [
  { value: 'Football',   label: 'Bóng đá' },
  { value: 'Basketball', label: 'Bóng rổ' },
  { value: 'Tennis',     label: 'Tennis' },
  { value: 'Cricket',    label: 'Cricket' },
  { value: 'Swimming',   label: 'Bơi lội' },
  { value: 'Badminton',  label: 'Cầu lông' },
  { value: 'Golf',       label: 'Golf' },
  { value: 'Cycling',    label: 'Đạp xe' },
]

const LEVELS = [
  { value: 'Beginner',     label: 'Mới bắt đầu' },
  { value: 'Intermediate', label: 'Trung cấp' },
  { value: 'Advanced',     label: 'Nâng cao' },
  { value: 'Professional', label: 'Chuyên nghiệp' },
]

/* ── Inline SVG icons for section headers ── */
const IconAvatar = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="6" r="3" stroke="#2563eb" strokeWidth="1.4"/>
    <path d="M2 13c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

const IconInfo = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="#16a34a" strokeWidth="1.4"/>
    <path d="M5 6h6M5 9h4" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const IconLocation = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.485-2.015-4.5-4.5-4.5z"
      stroke="#ea580c" strokeWidth="1.4"/>
    <circle cx="8" cy="6" r="1.5" stroke="#ea580c" strokeWidth="1.3"/>
  </svg>
)

const IconSport = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.5" stroke="#9333ea" strokeWidth="1.4"/>
    <path d="M2 8h12" stroke="#9333ea" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M8 1.5c-2 2-2 3.5 0 6.5s2 4.5 0 6.5" stroke="#9333ea" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M4.5 3.5c1.2 1.2 1.8 2.8 1.8 4.5S5.7 11 4.5 12.5"
      stroke="#9333ea" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)

const IconCheck = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function ProfileForm({ form, onSubmit, isSubmitting = false, userId }) {
  const { formData, errors, touched, handleChange, handleBlur, setFieldValue } = form

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit} noValidate>

      {/* ── Avatar ── */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon form-section-icon--avatar">
            <IconAvatar />
          </div>
          <h2>Ảnh đại diện</h2>
        </div>
        <div className="form-section-body">
          <AvatarUpload
            userId={userId}
            onUpload={(url) => setFieldValue('avatarUrl', url)}
            currentAvatar={formData.avatarUrl}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* ── Personal info ── */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon form-section-icon--info">
            <IconInfo />
          </div>
          <h2>Thông tin cá nhân</h2>
        </div>
        <div className="form-section-body">
          <div className="form-row">
            <FormField
              label="Tên"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.firstName ? errors.firstName : ''}
              disabled={isSubmitting}
            />
            <FormField
              label="Họ"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.lastName ? errors.lastName : ''}
              disabled={isSubmitting}
            />
          </div>

          <FormField
            label="Địa chỉ email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email ? errors.email : ''}
            disabled={isSubmitting}
          />

          <div className="form-row">
            <FormField
              label="Số điện thoại"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone ? errors.phone : ''}
              disabled={isSubmitting}
            />
            <FormField
              label="Ngày sinh"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.dateOfBirth ? errors.dateOfBirth : ''}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* ── Location ── */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon form-section-icon--loc">
            <IconLocation />
          </div>
          <h2>Thông tin địa điểm</h2>
        </div>
        <div className="form-section-body">
          <FormField
            label="Địa chỉ"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.address ? errors.address : ''}
            disabled={isSubmitting}
          />
          <FormField
            label="Khu vực sinh sống"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.location ? errors.location : ''}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* ── Sports ── */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon form-section-icon--sport">
            <IconSport />
          </div>
          <h2>Sở thích thể thao</h2>
        </div>
        <div className="form-section-body">
          <div className="form-row">
            <FormField
              label="Môn thể thao yêu thích"
              name="sportPreference"
              type="select"
              value={formData.sportPreference}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.sportPreference ? errors.sportPreference : ''}
              disabled={isSubmitting}
              options={[{ value: '', label: 'Chọn môn thể thao' }, ...SPORTS]}
            />
            <FormField
              label="Trình độ"
              name="sportLevel"
              type="select"
              value={formData.sportLevel}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.sportLevel ? errors.sportLevel : ''}
              disabled={isSubmitting}
              options={[{ value: '', label: 'Chọn trình độ' }, ...LEVELS]}
            />
          </div>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            'Đang lưu...'
          ) : (
            <>
              <IconCheck />
              Lưu hồ sơ
            </>
          )}
        </button>
      </div>

    </form>
  )
}