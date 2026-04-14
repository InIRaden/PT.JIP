type AppLogoProps = {
  className?: string;
  alt?: string;
};

export function AppLogo({
  className = 'h-12 w-auto',
  alt = 'Logo PT Jayeng Inti Pratama',
}: AppLogoProps) {
  return (
    <img
      src="/assets/branding/logo-jip.png"
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}
