export function Logo({ className = 'w-10 h-10', showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        className={className}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ماموت شاپ"
      >
        <defs>
          <linearGradient id="mammoth-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1566e1" />
            <stop offset="50%" stopColor="#1c7df5" />
            <stop offset="100%" stopColor="#329dff" />
          </linearGradient>
          <linearGradient id="tusk-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff9d39" />
            <stop offset="100%" stopColor="#fd800f" />
          </linearGradient>
        </defs>
        {/* Rounded background */}
        <rect width="48" height="48" rx="14" fill="url(#mammoth-grad)" />
        {/* Mammoth body - simplified iconographic shape */}
        <path
          d="M14 30 C14 34 16 36 20 36 L20 40 L22 40 L22 36 L26 36 L26 40 L28 40 L28 36 C32 36 34 34 34 30 L34 22 C34 17 30 13 24 13 C18 13 14 17 14 22 Z"
          fill="white"
          opacity="0.95"
        />
        {/* Mammoth head/top hump */}
        <path
          d="M24 13 C24 13 20 9 16 10 C14 11 14 14 16 15 C18 15 20 14 20 14"
          fill="white"
          opacity="0.95"
        />
        {/* Eye */}
        <circle cx="21" cy="22" r="1.6" fill="#1566e1" />
        {/* Tusks */}
        <path
          d="M16 30 C13 31 12 33 12 36"
          stroke="url(#tusk-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M32 30 C35 31 36 33 36 36"
          stroke="url(#tusk-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Trunk */}
        <path
          d="M24 30 Q24 34 23 37 Q22 39 24 41"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
      </svg>
      {showText && (
        <span className="font-800 text-lg tracking-tight text-gray-900">
          ماموت<span className="text-primary-600">شاپ</span>
        </span>
      )}
    </div>
  );
}
