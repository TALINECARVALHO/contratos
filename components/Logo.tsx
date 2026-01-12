
import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  lightMode?: boolean; // Se true, ajusta cores do texto para fundo escuro
}

export const Logo: React.FC<LogoProps> = ({ size = 40, className = "", showText = false, lightMode = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm transition-transform hover:scale-105"
        >
          {/* Shield Outline */}
          <path
            d="M12 22S3 17 3 10V5l9-4 9 4v5c0 7-9 12-9 12z"
            fill={lightMode ? "#1e293b" : "#f1f5f9"} // slate-850 / slate-100
            stroke={lightMode ? "#3b82f6" : "#3b82f6"} // blue-500
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Document Icon */}
          <g transform="translate(6, 6) scale(0.5)">
            <path
              d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
              fill={lightMode ? "#3b82f6" : "#3b82f6"} // blue-500
            />
            {/* Checkmark */}
            <path
              d="M14 2v6h6"
              stroke={lightMode ? "#1e293b" : "#f1f5f9"} // slate-850 / slate-100
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M8 16l2.5 2.5L16 13"
              stroke={lightMode ? "#1e293b" : "#f1f5f9"} // slate-850 / slate-100
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none justify-center">
          <span className={`font-bold text-xl tracking-tight ${lightMode ? 'text-white' : 'text-blue-600'}`}>
            TriDoc
          </span>
        </div>
      )}
    </div>
  );
};
