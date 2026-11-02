import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    const finishSignIn = () => {
      if (active) navigate('/', { replace: true });
    };

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const urlError = hashParams.get('error') || queryParams.get('error');
    const errorDescription = hashParams.get('error_description')
      || queryParams.get('error_description');

    if (urlError) {
      setErrorMessage(errorDescription || urlError);
      return () => {
        active = false;
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        finishSignIn();
      }
    });

    const completeSignIn = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) {
        finishSignIn();
      } else if (active) {
        setErrorMessage('No se pudo completar el inicio de sesión. Inténtalo de nuevo.');
      }
    };

    void completeSignIn().catch((error: unknown) => {
      if (active) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al completar el inicio de sesión.');
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft">
      <div className="rounded-2xl bg-surface p-8 text-center shadow-xl shadow-border/20">
        {errorMessage ? (
          <>
            <h2 className="text-xl font-bold text-error">No se pudo iniciar sesión</h2>
            <p className="mt-2 text-text-muted">{errorMessage}</p>
            <Button className="mt-6" onClick={() => navigate('/login', { replace: true })}>
              Volver al inicio de sesión
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-text-strong">Autenticando...</h2>
            <p className="mt-2 text-text-muted">Por favor espera un momento.</p>
          </>
        )}
      </div>
    </div>
  );
};
