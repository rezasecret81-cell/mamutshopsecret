import { useEffect, useState } from 'react';

type LoaderVariant = 'full' | 'page' | 'section' | 'inline';

type LoaderProps = {
  variant?: LoaderVariant;
  show?: boolean;
  text?: string;
};

export function Loader({
  variant = 'full',
  show = true,
  text,
}: LoaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let delayTimer: number;

    if (show) {
      delayTimer = window.setTimeout(() => {
        setVisible(true);
      }, 150);
    } else {
      setVisible(false);
    }

    return () => {
      clearTimeout(delayTimer);
    };
  }, [show]);

  if (!visible) return null;

  if (variant === 'full') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
            <MamutLogo />
          </div>
          {text && (
            <p className="mt-4 text-gray-500 text-sm font-500">{text}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className="min-h-[400px] flex items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
            <MamutLogo size="sm" />
          </div>
          {text && (
            <p className="mt-4 text-gray-500 text-sm">{text}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div className="p-8 flex items-center justify-center animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
          <MamutLogo size="xs" />
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <span className="inline-flex items-center gap-2 animate-fade-in">
      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
        <span className="text-white text-xs font-bold">M</span>
      </div>
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </span>
  );
}

function MamutLogo({ size = 'md' }: { size?: 'xs' | 'sm' | 'md' }) {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
  };

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizes[size]}
      >
        <path
          d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z"
          fill="white"
          fillOpacity="0.15"
        />
        <path
          d="M16 4c-1.105 0-2 .895-2 2v4h4V6c0-1.105-.895-2-2-2zm-6 8c-1.105 0-2 .895-2 2v4h4v-4c0-1.105-.895-2-2-2zm12 0c-1.105 0-2 .895-2 2v4h4v-4c0-1.105-.895-2-2-2zm-6 6c-2.21 0-4 1.79-4 4v6h8v-6c0-2.21-1.79-4-4-4z"
          fill="white"
          fillOpacity="0.9"
        />
        <path
          d="M10 14l-2 4h4l-2-4zm12 0l-2 4h4l-2-4z"
          fill="white"
        />
      </svg>
    </div>
  );
}

// Skeleton loaders
export function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="w-full aspect-square bg-gray-200 rounded-xl mb-3" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-white rounded-xl">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function PageTransition({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading?: boolean;
}) {
  const [showContent, setShowContent] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (loading) {
      setShowContent(false);
      setShowLoader(true);
    } else {
      setShowLoader(false);
      const timer = setTimeout(() => setShowContent(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading && showLoader) {
    return <Loader variant="page" />;
  }

  return (
    <div
      className={`transition-all duration-200 ${
        showContent ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
