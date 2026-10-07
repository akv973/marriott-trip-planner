export function ContourArt() {
  return (
    <svg className="contour-art" viewBox="0 0 520 520" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((line) => (
          <path key={line} transform={`translate(${line * -8} ${line * 14})`}
            d="M570-40C302-9 470 88 337 160S191 176 214 290s-176 118-205 274" />
        ))}
        {[0, 1, 2, 3, 4, 5].map((line) => (
          <ellipse key={`ring-${line}`} cx="375" cy="295" rx={34 + line * 23} ry={46 + line * 26}
            transform="rotate(-31 375 295)" />
        ))}
      </g>
      <circle cx="340" cy="233" r="6" fill="var(--clay)" />
      <circle cx="340" cy="233" r="17" fill="none" stroke="var(--clay)" />
    </svg>
  );
}
