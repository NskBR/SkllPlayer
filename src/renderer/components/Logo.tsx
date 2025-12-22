interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 40, className = '' }: LogoProps): JSX.Element {
  return (
    <div
      className={`flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <img
        src="./Icon/symbol.png"
        alt="SkllPlayer"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
        }}
        draggable={false}
      />
    </div>
  );
}
