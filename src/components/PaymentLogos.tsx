import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Wave Official Brand Logo (Cyan Penguin on Circle / Wave Wordmark)
 */
export const WaveLogo: React.FC<LogoProps> = ({ className = "h-5 w-auto" }) => (
  <svg
    viewBox="0 0 120 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Wave"
  >
    {/* Background rounded badge */}
    <rect width="120" height="40" rx="8" fill="#1DC4FF" />
    
    {/* Wave Penguin Icon */}
    <g transform="translate(10, 6) scale(0.68)">
      {/* Penguin body shadow/base */}
      <ellipse cx="20" cy="38" rx="14" ry="3" fill="#0094CC" opacity="0.4" />
      {/* Penguin outer dark body */}
      <path
        d="M20 3C13.5 3 8 9 8 18C8 24 10 32 10.5 35C11 38 14 39 20 39C26 39 29 38 29.5 35C30 32 32 24 32 18C32 9 26.5 3 20 3Z"
        fill="#0E2D4A"
      />
      {/* White belly */}
      <path
        d="M20 13C16 13 13 18 13 25C13 32 15.5 36 20 36C24.5 36 27 32 27 25C27 18 24 13 20 13Z"
        fill="#FFFFFF"
      />
      {/* Eyes */}
      <ellipse cx="16.5" cy="11" rx="2" ry="2.5" fill="#FFFFFF" />
      <circle cx="17" cy="11" r="1.2" fill="#0E2D4A" />
      <ellipse cx="23.5" cy="11" rx="2" ry="2.5" fill="#FFFFFF" />
      <circle cx="23" cy="11" r="1.2" fill="#0E2D4A" />
      {/* Beak */}
      <path d="M18.5 13.5L20 17L21.5 13.5Z" fill="#FFA500" stroke="#E68A00" strokeWidth="0.5" />
      {/* Feet */}
      <ellipse cx="14" cy="38" rx="4" ry="1.5" fill="#FFA500" />
      <ellipse cx="26" cy="38" rx="4" ry="1.5" fill="#FFA500" />
    </g>

    {/* "wave" typography */}
    <text
      x="40"
      y="26"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="19"
      fontWeight="900"
      letterSpacing="-0.5px"
      fill="#FFFFFF"
    >
      wave
    </text>
  </svg>
);

/**
 * Wave Icon (Square / Compact)
 */
export const WaveIcon: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Wave Icon"
  >
    <rect width="40" height="40" rx="10" fill="#1DC4FF" />
    <g transform="translate(0, -1)">
      <path
        d="M20 7C14 7 9 12.5 9 20C9 25.5 10.8 32 11.5 34C12 36 14.5 37 20 37C25.5 37 28 36 28.5 34C29 32 31 25.5 31 20C31 12.5 26 7 20 7Z"
        fill="#0E2D4A"
      />
      <path
        d="M20 15C16.5 15 13.5 19.5 13.5 25.5C13.5 31.5 16 34.5 20 34.5C24 34.5 26.5 31.5 26.5 25.5C26.5 19.5 23.5 15 20 15Z"
        fill="#FFFFFF"
      />
      <ellipse cx="17" cy="13.5" rx="1.8" ry="2" fill="#FFFFFF" />
      <circle cx="17.5" cy="13.5" r="1" fill="#0E2D4A" />
      <ellipse cx="23" cy="13.5" rx="1.8" ry="2" fill="#FFFFFF" />
      <circle cx="22.5" cy="13.5" r="1" fill="#0E2D4A" />
      <path d="M18.8 15.5L20 18.5L21.2 15.5Z" fill="#FFA500" />
      <ellipse cx="14.5" cy="36.5" rx="3.5" ry="1.2" fill="#FFA500" />
      <ellipse cx="25.5" cy="36.5" rx="3.5" ry="1.2" fill="#FFA500" />
    </g>
  </svg>
);

/**
 * Orange Money Official Brand Logo
 */
export const OrangeMoneyLogo: React.FC<LogoProps> = ({ className = "h-5 w-auto" }) => (
  <svg
    viewBox="0 0 140 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Orange Money"
  >
    {/* Black / Dark background */}
    <rect width="140" height="40" rx="8" fill="#000000" />
    
    {/* Orange Square Logo */}
    <rect x="7" y="7" width="26" height="26" rx="4" fill="#FF7900" />
    
    {/* "orange" & "money" typography */}
    <g fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif">
      <text x="39" y="19" fontSize="11" fontWeight="700" letterSpacing="-0.2px" fill="#FF7900">
        orange
      </text>
      <text x="39" y="31" fontSize="12" fontWeight="900" letterSpacing="-0.2px" fill="#FFFFFF">
        money
      </text>
    </g>
  </svg>
);

/**
 * Orange Money Icon (Square / Compact)
 */
export const OrangeMoneyIcon: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Orange Money Icon"
  >
    <rect width="40" height="40" rx="10" fill="#FF7900" />
    <text
      x="20"
      y="25"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="13"
      fontWeight="900"
      fill="#FFFFFF"
      textAnchor="middle"
      letterSpacing="-0.5px"
    >
      OM
    </text>
  </svg>
);

/**
 * Free Money Official Brand Logo (Senegal)
 */
export const FreeMoneyLogo: React.FC<LogoProps> = ({ className = "h-5 w-auto" }) => (
  <svg
    viewBox="0 0 120 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Free Money"
  >
    <rect width="120" height="40" rx="8" fill="#CC0000" />
    <g transform="translate(10, 5)">
      {/* "free" italic script style */}
      <text
        x="2"
        y="21"
        fontFamily="Georgia, serif"
        fontSize="19"
        fontStyle="italic"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        free
      </text>
      {/* "money" */}
      <text
        x="42"
        y="21"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="12"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="0.5px"
      >
        MONEY
      </text>
    </g>
  </svg>
);

/**
 * Free Money Icon (Compact)
 */
export const FreeMoneyIcon: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Free Money Icon"
  >
    <rect width="40" height="40" rx="10" fill="#CC0000" />
    <text
      x="20"
      y="24"
      fontFamily="Georgia, serif"
      fontSize="14"
      fontStyle="italic"
      fontWeight="bold"
      fill="#FFFFFF"
      textAnchor="middle"
    >
      free
    </text>
  </svg>
);

/**
 * Visa Official Wordmark Logo
 */
export const VisaLogo: React.FC<LogoProps> = ({ className = "h-5 w-auto" }) => (
  <svg
    viewBox="0 0 90 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Visa"
  >
    <rect width="90" height="40" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    <g transform="translate(15, 10)">
      {/* Official Visa letters in deep blue */}
      <path
        d="M24.8 19.5L28.3 0.8H22.7L19.2 19.5H24.8ZM43.4 1.3C42.2 0.8 40.4 0.4 38.2 0.4C32.4 0.4 28.4 3.4 28.3 7.7C28.2 10.9 31.1 12.7 33.3 13.8C35.5 14.9 36.3 15.6 36.3 16.5C36.3 18 34.5 18.7 32.7 18.7C30.4 18.7 29.1 18.3 27.5 17.5L26.6 17.1L25.6 21.6C26.9 22.2 29.5 22.8 32.2 22.8C38.3 22.8 42.3 19.8 42.4 15.2C42.5 12.4 40.7 10.4 37.1 8.7C35 7.6 33.7 6.9 33.7 5.8C33.7 4.8 34.9 3.8 37.2 3.8C39.1 3.8 40.6 4.2 41.6 4.7L42.1 4.9L43.4 1.3ZM56.3 0.8H51.9C50.6 0.8 49.5 1.2 49 2.5L41.8 19.5H47.6L48.8 16.2H55.8L56.4 19.5H61.6L56.3 0.8ZM50.3 12.2L53.2 4.3L54.9 12.2H50.3ZM14.9 0.8L9.5 13.6L7.4 2.8C7.1 1.4 6 0.8 4.7 0.8H0L0.2 1.6C1.9 2 4.1 3.2 5.5 4.5L10.3 22.8H16.2L24.8 0.8H14.9Z"
        fill="#1434CB"
      />
      {/* Golden accent on V horn */}
      <path
        d="M4.7 0.8H0L0.2 1.6C1.9 2 4.1 3.2 5.5 4.5L7.4 2.8C7.1 1.4 6 0.8 4.7 0.8Z"
        fill="#F9A01B"
      />
    </g>
  </svg>
);

/**
 * Mastercard Official Interlocking Circles Logo
 */
export const MastercardLogo: React.FC<LogoProps> = ({ className = "h-5 w-auto" }) => (
  <svg
    viewBox="0 0 85 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Mastercard"
  >
    <rect width="85" height="40" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    <g transform="translate(14, 5)">
      {/* Red circle */}
      <circle cx="19" cy="15" r="13" fill="#EB001B" />
      {/* Yellow-orange circle */}
      <circle cx="37" cy="15" r="13" fill="#F79E1B" fillOpacity="0.95" />
      {/* Intersection Venn shape */}
      <path
        d="M28 6.7C30.6 8.8 32.3 11.8 32.3 15C32.3 18.2 30.6 21.2 28 23.3C25.4 21.2 23.7 18.2 23.7 15C23.7 11.8 25.4 8.8 28 6.7Z"
        fill="#FF5F00"
      />
    </g>
  </svg>
);

/**
 * PayDunya Official Brand Badge (Certified Gateway)
 */
export const PayDunyaLogo: React.FC<LogoProps> = ({ className = "h-6 w-auto" }) => (
  <svg
    viewBox="0 0 145 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="PayDunya"
  >
    <rect width="145" height="40" rx="8" fill="#0A2540" />
    <g transform="translate(10, 8)">
      {/* PayDunya P-Orb symbol */}
      <circle cx="12" cy="12" r="11" fill="#00D084" />
      <circle cx="12" cy="12" r="6" fill="#0A2540" />
      <path d="M12 1L21 8L12 12Z" fill="#00B4D8" />

      {/* PayDunya brand text */}
      <text
        x="29"
        y="16"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="15"
        fontWeight="800"
        letterSpacing="-0.3px"
        fill="#FFFFFF"
      >
        PAY<tspan fill="#00D084">DUNYA</tspan>
      </text>
    </g>
  </svg>
);

/**
 * A combined badge ribbon of all official payment logos
 */
export const AllPaymentLogosRibbon: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Wave Official */}
      <div className="rounded-xl overflow-hidden shadow-sm hover:scale-105 transition-transform">
        <WaveLogo className={compact ? "h-6 w-auto" : "h-8 w-auto"} />
      </div>

      {/* Orange Money Official */}
      <div className="rounded-xl overflow-hidden shadow-sm hover:scale-105 transition-transform">
        <OrangeMoneyLogo className={compact ? "h-6 w-auto" : "h-8 w-auto"} />
      </div>

      {/* Free Money Official */}
      <div className="rounded-xl overflow-hidden shadow-sm hover:scale-105 transition-transform">
        <FreeMoneyLogo className={compact ? "h-6 w-auto" : "h-8 w-auto"} />
      </div>

      {/* Visa Official */}
      <div className="rounded-xl overflow-hidden shadow-sm hover:scale-105 transition-transform">
        <VisaLogo className={compact ? "h-6 w-auto" : "h-8 w-auto"} />
      </div>

      {/* Mastercard Official */}
      <div className="rounded-xl overflow-hidden shadow-sm hover:scale-105 transition-transform">
        <MastercardLogo className={compact ? "h-6 w-auto" : "h-8 w-auto"} />
      </div>

      {/* PayDunya Official */}
      <div className="rounded-xl overflow-hidden shadow-sm hover:scale-105 transition-transform">
        <PayDunyaLogo className={compact ? "h-6 w-auto" : "h-8 w-auto"} />
      </div>
    </div>
  );
};
