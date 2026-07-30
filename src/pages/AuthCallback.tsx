import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Check for errors in URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      const urlError = hashParams.get('error') || queryParams.get('error');
      const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');
      
      if (urlError) {
         if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', payload: errorDesc || urlError }, '*');
            window.setTimeout(() => window.close(), 100);
         } else {
            navigate('/login');
         }
         return;
      }

      // Supabase parses URL hash automatically and updates local storage.
      const { data, error } = await supabase.auth.getSession();
      
      if (data.session) {
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
          window.setTimeout(() => window.close(), 100);
        } else {
           navigate('/');
        }
      }
    };

    handleAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
          window.setTimeout(() => window.close(), 100);
        } else {
           navigate('/');
        }
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="p-8 text-center bg-white shadow-xl rounded-2xl animate-pulse">
        <h2 className="text-xl font-bold text-slate-800">Autenticando...</h2>
        <p className="text-slate-500 mt-2">Por favor espera un momento.</p>
      </div>
    </div>
  );
};
