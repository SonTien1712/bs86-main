// Format email display (hide part of email for privacy)
export const formatEmailDisplay = (email) => {
  const [localPart, domain] = email.split('@');
  const visibleChars = Math.max(2, Math.floor(localPart.length / 2));
  const hiddenChars = '*'.repeat(Math.max(1, localPart.length - visibleChars));
  return `${localPart.substring(0, visibleChars)}${hiddenChars}@${domain}`;
};

// Format countdown timer
export const formatTimeLeft = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format OTP input (adds spacing between digits)
export const formatOTP = (value) => {
  return value.replace(/\D/g, '').slice(0, 6);
};
