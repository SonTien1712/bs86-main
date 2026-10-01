// Validation functions
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validatePhone = (phone) => {
  // Simple phone validation - adjust regex based on your requirements
  const regex = /^[\d\s\-\+\(\)]{10,}$/
  return regex.test(phone.replace(/\s/g, ''))
}

export const validateDate = (dateString) => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

export const validateAge = (dateString) => {
  const birthDate = new Date(dateString)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18
  }
  return age >= 18
}

export const validateAddress = (address) => {
  return address && address.trim().length >= 5
}

export const validateLocation = (location) => {
  return location && location.trim().length >= 2
}

// Profile validation schema
export const validateProfileData = (data) => {
  const errors = {}

  // First Name validation
  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters'
  }

  // Last Name validation
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters'
  }

  // Email validation
  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  // Phone validation
  if (!data.phone || !validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number'
  }

  // Date of Birth validation
  if (!data.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required'
  } else if (!validateDate(data.dateOfBirth)) {
    errors.dateOfBirth = 'Please enter a valid date'
  } else if (!validateAge(data.dateOfBirth)) {
    errors.dateOfBirth = 'You must be at least 18 years old'
  }

  // Address validation
  if (!data.address || !validateAddress(data.address)) {
    errors.address = 'Address must be at least 5 characters'
  }

  // Location (City) validation
  if (!data.location || !validateLocation(data.location)) {
    errors.location = 'Location must be at least 2 characters'
  }

  // Sport Preference validation
  if (!data.sportPreference || data.sportPreference.trim().length === 0) {
    errors.sportPreference = 'Please select a sport'
  }

  // Sport Level validation
  if (!data.sportLevel || data.sportLevel.trim().length === 0) {
    errors.sportLevel = 'Please select a level'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
