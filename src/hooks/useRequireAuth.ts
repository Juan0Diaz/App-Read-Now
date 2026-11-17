import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (user) return true;

    navigate('/login', { state: { from: location } });
    return false;
  }, [location, navigate, user]);
}
