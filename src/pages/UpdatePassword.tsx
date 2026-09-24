import React, { useState, useEffect } from 'react';
import { supabase, isDemoMode } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth(); // Permite mantener la sesión del usuario que quiere cambiar la contraseña

  useEffect(() => {
    // Supabase passes error in hash fragment if token is invalid or expired
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorDescription = hashParams.get('error_description');
    if (errorDescription) {
      setSessionError(errorDescription.replace(/\+/g, ' '));
    }
  }, []);

  const handleResendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecoverySent(false);
    try {
      if (!recoveryEmail) throw new Error('Ingresa un correo electrónico.');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(recoveryEmail);
      if (resetError) throw resetError;
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

      // Actualizar contraseña en Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Actualizar la contraseña en tabla de usuario si el contexto del usuario está disponible.
      if (user?.id_usuario) {
        const { error: dbError } = await supabase
          .from('Usuario')
          .update({ contrasena: password })
          .eq('id_usuario', user.id_usuario);
        
        if (dbError) {
          console.error("No se pudo actualizar la contraseña en la tabla Usuario:", dbError);
          
        }
      }

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
              El enlace es inválido o ha expirado. Ha sido utilizado o se superó el tiempo límite.
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
