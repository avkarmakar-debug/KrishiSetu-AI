import { Sprout } from 'lucide-react';
import { useState } from 'react';

interface CropImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function CropImage({ src, alt, className = '', fallbackLabel }: CropImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#E9F5EC] text-[#1B7F3B] ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sprout className="w-8 h-8 opacity-80" />
        {fallbackLabel && (
          <span className="mt-1.5 text-xs font-medium text-[#14231A]/70 px-2 text-center truncate max-w-full">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
