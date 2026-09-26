import React from 'react'

export interface LogoProps {
  variant?: 'mark' | 'full' | 'vertical'
  size?: 'sm' | 'md' | 'lg' | 'xl' | number
  theme?: 'default' | 'on-orange' | 'light' | 'dark'
  showTagline?: boolean
  className?: string
  style?: React.CSSProperties
}

const sizeMap = {
  sm: 36,
  md: 48,
  lg: 60,
  xl: 76,
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  theme = 'default',
  showTagline = true,
  className = '',
  style,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 48

  // Theme color determinations
  const isDarkBg = theme === 'light' || theme === 'dark'

  // Text color palette
  const eyebrowColor = isDarkBg ? '#FDCC3B' : '#4D0711'
  const titleColor = isDarkBg ? '#FEFEF6' : '#4D0711'
  const taglineColor = isDarkBg ? '#8BDFFA' : '#4D0711'

  // Squircle Container Colors for Logo Mark
  const containerBg = isDarkBg ? '#FD7E3B' : '#4D0711'
  const containerBorder = isDarkBg ? '#FEFEF6' : '#FDCC3B'

  const markSvg = (
    <svg
      className={`pw-logo-mark-svg ${className}`}
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: 'block' }}
      aria-label="The Pizza Wave mark"
    >
      {/* Background Badge Container with Golden Stroke */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="26"
        fill={containerBg}
        stroke={containerBorder}
        strokeWidth="3.5"
      />

      {/* Wave Steam Dots */}
      <circle cx="32" cy="15" r="2.8" fill="#FEFEF6" />
      <circle cx="50" cy="12" r="3.8" fill="#FDCC3B" />
      <circle cx="68" cy="15" r="2.8" fill="#FEFEF6" />

      {/* Pizza Wave Top Crust Arch */}
      <path
        d="M 16 26 C 33 16, 67 16, 84 26 C 86 27, 86 30, 84 31 C 74 36, 62 35, 50 33 C 38 31, 26 30, 16 31 C 14 30, 14 27, 16 26 Z"
        fill="#FDCC3B"
        stroke="#4D0711"
        strokeWidth="2.5"
      />

      {/* Main Pizza Slice Outer Structure */}
      <path
        d="M 18 31 L 82 31 L 52 86 C 50 89.5, 46 89.5, 44 86 L 18 31 Z"
        fill="#FEFEF6"
        stroke="#4D0711"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Cheese Wave Flow Layer 1 (Golden Yellow) */}
      <path
        d="M 20 34 C 32 42, 42 34, 52 41 C 62 48, 72 39, 80 34 L 50 84 Z"
        fill="#FDCC3B"
      />

      {/* Ocean Wave Ripple Layer 2 (Wave Orange) */}
      <path
        d="M 22 37 C 33 44, 41 40, 50 45 C 59 50, 68 43, 77 37 C 68 54, 58 68, 50 83 C 42 68, 31 54, 22 37 Z"
        fill="#FD7E3B"
      />

      {/* Wave Pepperoni Accents */}
      <circle cx="38" cy="48" r="6.2" fill="#BD1F17" stroke="#4D0711" strokeWidth="1.8" />
      <circle cx="58" cy="53" r="5.2" fill="#BD1F17" stroke="#4D0711" strokeWidth="1.6" />
      <circle cx="47" cy="67" r="4.2" fill="#BD1F17" stroke="#4D0711" strokeWidth="1.4" />
    </svg>
  )

  if (variant === 'mark') {
    return (
      <div
        className={`pw-logo-wrapper ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.18))',
          transform: 'rotate(-3deg)',
          transition: 'transform 0.2s ease',
          ...style,
        }}
      >
        {markSvg}
      </div>
    )
  }

  if (variant === 'vertical') {
    return (
      <div
        className={`pw-logo-stacked ${className}`}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.4rem',
          ...style,
        }}
      >
        <div style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))', transform: 'rotate(-3deg)' }}>
          {markSvg}
        </div>
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div
            style={{
              fontFamily: 'Phudu, Poppins, sans-serif',
              fontWeight: 800,
              fontSize: `${Math.round(pixelSize * 0.3)}px`,
              color: eyebrowColor,
              letterSpacing: '0.22em',
              marginBottom: '2px',
            }}
          >
            THE
          </div>
          <div
            style={{
              fontFamily: 'Phudu, Poppins, sans-serif',
              fontWeight: 900,
              fontSize: `${Math.round(pixelSize * 0.52)}px`,
              color: titleColor,
              letterSpacing: '0.04em',
            }}
          >
            PIZZA WAVE
          </div>
          {showTagline && (
            <div
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: `${Math.round(pixelSize * 0.22)}px`,
                color: taglineColor,
                letterSpacing: '0.14em',
                marginTop: '4px',
              }}
            >
              GRAND ROAD · PURI
            </div>
          )}
        </div>
      </div>
    )
  }

  // Horizontal Full Lockup
  return (
    <div
      className={`pw-logo-horizontal ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${Math.max(8, Math.round(pixelSize * 0.24))}px`,
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
      aria-label="The Pizza Wave"
    >
      <div
        style={{
          filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.18))',
          transform: 'rotate(-3deg)',
          transition: 'transform 0.2s ease',
        }}
      >
        {markSvg}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.05 }}>
        <span
          style={{
            fontFamily: 'Phudu, Poppins, sans-serif',
            fontWeight: 800,
            fontSize: `${Math.max(11, Math.round(pixelSize * 0.28))}px`,
            color: eyebrowColor,
            letterSpacing: '0.22em',
            marginBottom: '1px',
            textTransform: 'uppercase',
            opacity: 0.95,
          }}
        >
          THE
        </span>
        <strong
          style={{
            fontFamily: 'Phudu, Poppins, sans-serif',
            fontWeight: 900,
            fontSize: `${Math.max(18, Math.round(pixelSize * 0.54))}px`,
            color: titleColor,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          PIZZA WAVE
        </strong>
      </div>
    </div>
  )
}
