import * as React from 'react';
import { cn } from '../../lib/utils';

const avatarSizeMap = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-2xl',
  xl: 'h-32 w-32 text-4xl',
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: keyof typeof avatarSizeMap;
  name?: string;
  initials?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ size = 'md', name, initials, className, ...props }, ref) => {
    const content = initials ?? name?.charAt(0)?.toUpperCase() ?? '?';

    return (
      <div
        ref={ref}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ring-2 ring-white',
          avatarSizeMap[size],
          className
        )}
        aria-label={name ?? 'Avatar'}
        {...props}
      >
        {content}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
