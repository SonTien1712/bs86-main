import '../../styles/components/FormInput.css';

export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  disabled = false,
  autoComplete = 'off',
  required = false
}) {
  const hasError = touched && error;

  return (
    <div className="form-input-group">
      {label && (
        <label htmlFor={name} className="form-input-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`form-input ${hasError ? 'form-input-error' : ''}`}
      />
      {hasError && <p className="form-input-error-message">{error}</p>}
    </div>
  );
}
