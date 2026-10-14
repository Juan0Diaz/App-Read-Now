import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Revisar errores en la URL
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

      // Supabase analiza el hash de la URL y actualiza el almacenamiento local.
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
    <div className="flex min-h-screen items-center justify-center bg-surface-soft">
      <div className="animate-pulse rounded-2xl bg-surface p-8 text-center shadow-xl shadow-border/20">
        <h2 className="text-xl font-bold text-text-strong">Autenticando...</h2>
        <p className="mt-2 text-text-muted">Por favor espera un momento.</p>
      </div>
    </div>
  );
};
