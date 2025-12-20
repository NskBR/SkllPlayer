import { useTheme } from '../hooks/useTheme';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps): JSX.Element {
  const { colorOverrides } = useTheme();

  // Use accent color if customized, otherwise use the default accent
  const useCustomColor = !!colorOverrides.accent?.primary;

  return (
    <div
      className={`flex items-center justify-center font-bold select-none ${
        useCustomColor ? 'text-accent-primary' : 'text-accent-primary'
      } ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.85,
        lineHeight: 1,
      }}
    >
      <span
        style={{
          transform: 'rotate(90deg)',
          display: 'inline-block',
        }}
      >
        ₪
      </span>
    </div>
  );
}
