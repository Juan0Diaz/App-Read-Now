import React, { useState, useEffect } from 'react';
import { supabase, isDemoMode } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck, Lock } from 'lucide-react';
import { sendPasswordReset, updatePassword } from '../microservicios/Login';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (isDemoMode) {
      setSessionReady(true);
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    if (
      hashParams.get('error') ||
      hashParams.get('error_description') ||
      queryParams.get('error') ||
      queryParams.get('error_description')
    ) {
      setSessionError('El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.');
      return;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        setSessionReady(true);
        setSessionError('');
      } else if (event === 'SIGNED_OUT') {
        setSessionReady(false);
      }
    });

    void supabase.auth.getSession().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError) {
        setSessionError('No se pudo verificar el enlace de recuperación. Solicita uno nuevo.');
      } else if (data.session) {
        setSessionReady(true);
      } else {
        setSessionError('No hay una sesión de recuperación activa. Solicita un nuevo enlace desde el inicio de sesión.');
      }
    }).catch((authError: unknown) => {
      if (active) {
        console.error('Error al verificar la sesión de recuperación:', authError);
        setSessionError('No se pudo verificar el enlace de recuperación. Solicita uno nuevo.');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleResendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecoverySent(false);
    try {
      if (!recoveryEmail) throw new Error('Ingresa un correo electrónico.');
      await sendPasswordReset(recoveryEmail);
      setRecoverySent(true);
    } catch (err: any) {
      setError(err.message || 'Error al enviar recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])[^\s]+$/;
      if (!passwordRegex.test(password)) {
        throw new Error('La contraseña debe contener letras, números y signos/caracteres especiales, y no debe contener espacios.');
      }

      if (isDemoMode) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      await updatePassword(password);

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="-mt-10 flex h-full w-full flex-col items-center justify-center animate-in fade-in bg-surface-soft text-text-strong duration-500 dark:bg-surface-soft">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-xl shadow-border/20 dark:shadow-none sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-strong">
            Nueva Contraseña
          </h1>
          <p className="mt-2 text-sm font-medium text-text-muted">
            Ingresa y confirma tu nueva contraseña para acceder a la plataforma.
          </p>
        </div>

        {sessionError ? (
          <div className="space-y-5 text-center">
            <div className="mb-4 rounded-xl border border-error/20 bg-error-soft p-4 text-sm font-medium text-error">
              {sessionError}
            </div>
            
            {recoverySent ? (
              <div className="rounded-xl border border-success/20 bg-success-soft p-4 text-sm font-medium text-success">
                Se ha enviado un nuevo enlace. Por favor revisa tu correo.
              </div>
            ) : (
              <form onSubmit={handleResendRecovery} className="space-y-4">
                <p className="text-sm text-text-body">Ingresa tu correo para solicitar un nuevo enlace:</p>
                <Input 
                  type="email" 
                  placeholder="tu@correo.com" 
                  value={recoveryEmail}
                  onChange={e => setRecoveryEmail(e.target.value)}
                  required 
                  disabled={loading}
                />
                {error && <p className="text-sm font-semibold text-rose-600 p-2">{error}</p>}
                <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
                  {loading ? 'Enviando...' : 'Solicitar nuevo enlace'}
                </Button>
              </form>
            )}
            <Button variant="outline" className="mt-2 h-12 w-full rounded-xl" onClick={() => navigate('/login')}>
              Volver a Iniciar Sesión
            </Button>
          </div>
        ) : success ? (
          <div className="mb-4 flex flex-col items-center rounded-2xl border border-success/20 bg-success-soft p-6 text-center">
            <ShieldCheck className="mb-3 h-12 w-12 text-success" />
            <p className="mb-1 text-lg font-bold tracking-tight text-success">¡Contraseña actualizada!</p>
            <p className="text-sm text-success/80">Serás redirigido al inicio en unos segundos...</p>
          </div>
        ) : !sessionReady ? (
          <p className="rounded-xl border border-border bg-surface-soft p-4 text-center text-sm text-text-muted">
            Verificando el enlace de recuperación...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-text-body">Nueva Contraseña</label>
              <Input 
                type="password" 
                placeholder="Simbolos, números y letras, sin blancos" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
                minLength={6}
                disabled={loading}
                className="h-12 rounded-xl"
              />
            </div>

            {error && <p className="rounded-lg border border-error/20 bg-error-soft p-3 text-sm font-semibold text-error">{error}</p>}

            <Button type="submit" size="lg" className="h-12 w-full rounded-xl font-bold shadow-md shadow-primary/20" disabled={loading || !password}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
