export default function BrandLogo({ className = '', compact = false }) {
  const width = compact ? 132 : 148
  const height = compact ? 48 : 54

  return (
    <svg className={className} viewBox="0 0 320 120" aria-hidden="true" focusable="false" width={width} height={height}>
      <rect x="0" y="0" width="320" height="120" fill="none" />
      <path d="M28 60c0-23 15-38 44-38h22v76H72c-29 0-44-15-44-38Z" fill="none" stroke="currentColor" strokeWidth="10" />
      <path d="M128 22h64v76h-64z" fill="none" stroke="currentColor" strokeWidth="10" />
      <path d="M160 22c16 0 16 76 0 76s-16-76 0-76Z" fill="currentColor" />
      <path d="M226 22h22c29 0 44 15 44 38s-15 38-44 38h-22z" fill="none" stroke="currentColor" strokeWidth="10" />
      <path d="M8 60c0-13 4-23 11-31M312 60c0-13-4-23-11-31M8 60c0 13 4 23 11 31M312 60c0 13-4 23-11 31" fill="none" stroke="currentColor" strokeWidth="6" />
      <text x="160" y="114" textAnchor="middle" fontSize="20" letterSpacing="2" fill="currentColor">BENJAMIN DUVÉ</text>
    </svg>
  )
}

