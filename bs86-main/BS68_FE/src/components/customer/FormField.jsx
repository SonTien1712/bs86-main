/* FormField.jsx — premium redesign, drop-in replacement */

const FIELD_ICONS = {
  firstName: (
    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="5" r="3" stroke="#9ca3af" strokeWidth="1.3"/>
      <path d="M1.5 13c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  lastName: (
    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="5" r="3" stroke="#9ca3af" strokeWidth="1.3"/>
      <path d="M1.5 13c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  email: (
    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="13" height="9" rx="1.5" stroke="#9ca3af" strokeWidth="1.3"/>
      <path d="M1 4l6.5 5L14 4" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="1" width="9" height="13" rx="1.5" stroke="#9ca3af" strokeWidth="1.3"/>
      <circle cx="7.5" cy="11.5" r="0.7" fill="#9ca3af"/>
    </svg>
  ),
  dateOfBirth: (
    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="13" height="11" rx="1.5" stroke="#9ca3af" strokeWidth="1.3"/>
      <path d="M1 7h13M5 1v4M10 1v4" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  address: (
    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 1C5.015 1 3 3.015 3 5.5c0 3.5 4.5 8.5 4.5 8.5S12 9 12 5.5C12 3.015 9.985 1 7.5 1z" stroke="#9ca3af" strokeWidth="1.3"/>
      <circle cx="7.5" cy="5.5" r="1.5" stroke="#9ca3af" strokeWidth="1.2"/>
    </svg>
  ),
  location: (
    <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="7.5" r="6" stroke="#9ca3af" strokeWidth="1.3"/>
      <path d="M7.5 1.5c0 0-3 3-3 6s3 6 3 6M7.5 1.5c0 0 3 3 3 6s-3 6-3 6M1.5 7.5h12"
        stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
}

const PLACEHOLDERS = {
  firstName:        'Nhập tên của bạn',
  lastName:         'Nhập họ của bạn',
  email:            'email@example.com',
  phone:            '0901 234 567',
  dateOfBirth:      '',
  address:          'Số nhà, đường, phường...',
  location:         'Hải Châu, Đà Nẵng...',
  sportPreference:  '',
  sportLevel:       '',
}

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  disabled,
  options,
}) {
  const icon = FIELD_ICONS[name]
  const placeholder = PLACEHOLDERS[name] ?? ''
  const hasError = Boolean(error)
  const inputId = `field-${name}`

  const baseClass = [
    type === 'select' ? 'form-select' : 'form-input',
    !icon || type === 'select' ? 'no-icon' : '',
    hasError ? 'has-error' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="form-field">
      <label htmlFor={inputId} className="form-label">
        {label}
      </label>

      <div className="input-wrap">
        {icon && type !== 'select' && (
          <span className="input-prefix-icon" aria-hidden="true">
            {icon}
          </span>
        )}

        {type === 'select' ? (
          <select
            id={inputId}
            name={name}
            className={baseClass}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputId}
            name={name}
            type={type}
            className={baseClass}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete={
              name === 'email' ? 'email'
              : name === 'phone' ? 'tel'
              : name === 'firstName' ? 'given-name'
              : name === 'lastName' ? 'family-name'
              : undefined
            }
          />
        )}
      </div>

      {hasError && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}