interface RouteLocation {
  pathname: string;
  search?: string;
  hash?: string;
}

const isRouteLocation = (value: unknown): value is RouteLocation =>
  typeof value === 'object'
  && value !== null
  && 'pathname' in value
  && typeof value.pathname === 'string';

export const getSafeReturnPath = (value: unknown): string | null => {
  const path = isRouteLocation(value)
    ? `${value.pathname}${value.search ?? ''}${value.hash ?? ''}`
    : value;

  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
    ? path
    : null;
};

export const getLoginReturnPath = (state: unknown): string | null => {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return null;
  }

  return getSafeReturnPath(state.from);
};
