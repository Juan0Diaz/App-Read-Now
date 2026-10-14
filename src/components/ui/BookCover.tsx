import * as React from 'react';
import fallbackCover from '../../assets/no-cover.svg';
import { cn } from '../../lib/utils';

export interface BookCoverProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-28',
  md: 'w-full',
  lg: 'w-56',
};

const BookCover = React.forwardRef<HTMLImageElement, BookCoverProps>(
  ({ src, alt, size = 'md', className, ...props }, ref) => {
    const resolvedSrc = src || fallbackCover;

    return (
      <img
        ref={ref}
        src={resolvedSrc}
        alt={alt || 'Portada del libro'}
        loading="lazy"
        decoding="async"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 20vw"
        className={cn('aspect-[2/3] h-auto object-cover', sizeClasses[size], className)}
        {...props}
      />
    );
  }
);

BookCover.displayName = 'BookCover';

export { BookCover };
