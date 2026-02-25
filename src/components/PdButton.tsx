import { ButtonHTMLAttributes } from 'react';
import './PdButton.css';

interface PdButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  primary?: boolean;
  selected?: boolean;
  color?: 'green' | 'yellow' | 'red';
}

export function PdButton({
  label,
  primary = false,
  selected = false,
  color,
  disabled,
  className = '',
  ...props
}: PdButtonProps) {
  const buttonClasses = [
    'pd-button',
    primary ? 'pd-button--raised' : '',
    selected ? 'pd-button--outlined' : '',
    color || '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled}
      // Reflect label and selected as attributes for test compatibility
      {...{ label }}
      {...(selected ? { selected: '' } : {})}
      {...props}
    >
      <span className="pd-button__label">{label}</span>
      <span className="pd-button__background">
        <svg viewBox="0 0 46.4 45.9" preserveAspectRatio="none">
          <defs>
            <filter id="pd-shadow">
              <feDropShadow
                dx="0"
                dy="3"
                stdDeviation="0.5"
                floodColor="#000000"
                floodOpacity="0.2"
              />
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="1"
                floodColor="#000000"
                floodOpacity="0.14"
              />
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="1.5"
                floodColor="#000000"
                floodOpacity="0.12"
              />
            </filter>
          </defs>
          <path
            d="m44.4,43.3c-3.4,3.7 -36.9,3 -40.8,0.3s-5.4,-37.6 -0.3,-40.8s38.5,-4.2 40.8,-0.3s3.6,37.1 0.3,40.8z"
          />
        </svg>
      </span>
    </button>
  );
}
