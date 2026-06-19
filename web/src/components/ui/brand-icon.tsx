import type { SVGAttributes } from 'react';

type BrandIconProps = SVGAttributes<SVGSVGElement> & {
  size?: number;
  strokeWidth?: number;
};

export function BrandIcon({ size = 24, strokeWidth = 1.5, ...props }: BrandIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 4h18v5H3V4" />
      <path d="M3 4 4 3h18L21 4" />
      <path d="M21 4l1-1v5l-1 1" />
      <path d="M3 10h13v5H3V10" />
      <path d="M3 10 4 9h13L16 10" />
      <path d="M16 10l1-1v5l-1 1" />
      <path d="M3 16h18v5H3V16" />
      <path d="M3 16 4 15h18L21 16" />
      <path d="M21 16l1-1v5l-1 1" />
    </svg>
  );
}
