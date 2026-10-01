import { getPasswordStrength } from '../../utils/validation';
import '../../styles/components/PasswordStrength.css';

export default function PasswordStrength({ password }) {
  const strength = getPasswordStrength(password);

  const getStrengthColor = () => {
    switch (strength.score) {
      case 0:
      case 1:
        return 'weak';
      case 2:
        return 'fair';
      case 3:
        return 'good';
      case 4:
      case 5:
        return 'strong';
      default:
        return 'weak';
    }
  };

  const getStrengthWidth = () => {
    return `${(strength.score / 5) * 100}%`;
  };

  return (
    <div className="password-strength">
      <div className="strength-bar-container">
        <div
          className={`strength-bar strength-${getStrengthColor()}`}
          style={{ width: getStrengthWidth() }}
        />
      </div>
      <span className={`strength-label strength-${getStrengthColor()}`}>
        {strength.label}
      </span>
    </div>
  );
}
