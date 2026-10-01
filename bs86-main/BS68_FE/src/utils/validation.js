// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password) => {
  return password.length >= 8;
};

// Password strength calculation
export const getPasswordStrength = (password) => {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  return {
    score: strength,
    label: strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength <= 3 ? 'Good' : 'Strong'
  };
};

// Name validation
export const isValidName = (name) => {
  return name.trim().length >= 2;
};

// OTP validation (6 digits)
export const isValidOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

// Form validation errors
export const validateLoginForm = (email, password) => {
  const errors = {};
  
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  } else if (!isValidPassword(password)) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  return errors;
};

export const validateRegisterForm = (name, email, password, confirmPassword, termsAccepted) => {
  const errors = {};
  
  if (!name.trim()) {
    errors.name = 'Full name is required';
  } else if (!isValidName(name)) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!password) {
    errors.password = 'Password is required';
  } else if (!isValidPassword(password)) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  if (!termsAccepted) {
    errors.terms = 'You must accept the terms and conditions';
  }
  
  return errors;
};
