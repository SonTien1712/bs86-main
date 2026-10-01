import { useRef, useEffect } from 'react';
import '../../styles/components/OTPInput.css';

export default function OTPInput({ value, onChange, error, disabled = false }) {
  const inputRefs = useRef([]);

  const handleChange = (index, val) => {
    if (val.length > 1) {
      const newValue = val.slice(-1);
      onChange(value.substring(0, index) + newValue + value.substring(index + 1));
    } else {
      onChange(value.substring(0, index) + val + value.substring(index + 1));
    }

    // Auto-focus next input
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain');
    const cleanedData = pasteData.replace(/\D/g, '').slice(0, 6);

    if (cleanedData.length <= 6) {
      onChange(cleanedData);
    }
  };

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  return (
    <div className="otp-input-container">
      <div className="otp-input-group">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={value[index] || ''}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={disabled}
              className={`otp-input ${error ? 'otp-input-error' : ''}`}
              placeholder="0"
            />
          ))}
      </div>
      {error && <p className="otp-input-error-message">{error}</p>}
    </div>
  );
}
