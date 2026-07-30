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
  const { user } = useAuth(); // AuthContext will automatically pick up the recovery session

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

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // Update password in custom Usuario table if user context is available
      if (user?.id_usuario) {
        const { error: dbError } = await supabase
          .from('Usuario')
          .update({ contrasena: password })
          .eq('id_usuario', user.id_usuario);
        
        if (dbError) {
          console.error("No se pudo actualizar la contraseña en la tabla Usuario:", dbError);
          // Optional: throw new Error("Error en la DB local");
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
    <div className="flex flex-col h-full animate-in fade-in duration-500 w-full items-center justify-center -mt-10">
      <div className="w-full max-w-md mx-auto bg-white p-8 sm:p-10 border border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Nueva Contraseña
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            Ingresa y confirma tu nueva contraseña para acceder a la plataforma.
          </p>
        </div>

        {sessionError ? (
          <div className="space-y-5 text-center">
            <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 text-sm font-medium mb-4">
              El enlace es inválido o ha expirado. Ha sido utilizado o se superó el tiempo límite.
            </div>
            
            {recoverySent ? (
              <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 text-sm font-medium">
                Se ha enviado un nuevo enlace. Por favor revisa tu correo.
              </div>
            ) : (
              <form onSubmit={handleResendRecovery} className="space-y-4">
                <p className="text-sm text-slate-600">Ingresa tu correo para solicitar un nuevo enlace:</p>
                <Input 
                  type="email" 
                  placeholder="tu@correo.com" 
                  value={recoveryEmail}
                  onChange={e => setRecoveryEmail(e.target.value)}
                  required 
                  disabled={loading}
                />
                {error && <p className="text-sm font-semibold text-rose-600 p-2">{error}</p>}
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12" disabled={loading}>
                  {loading ? 'Enviando...' : 'Solicitar nuevo enlace'}
                </Button>
              </form>
            )}
            <Button variant="outline" className="w-full h-12 rounded-xl mt-2" onClick={() => navigate('/login')}>
              Volver a Iniciar Sesión
            </Button>
          </div>
        ) : success ? (
          <div className="mb-4 flex flex-col items-center p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
            <ShieldCheck className="h-12 w-12 text-emerald-500 mb-3" />
            <p className="text-emerald-800 font-bold tracking-tight text-lg mb-1">¡Contraseña actualizada!</p>
            <p className="text-emerald-700/80 text-sm">Serás redirigido al inicio en unos segundos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Nueva Contraseña</label>
              <Input 
                type="password" 
                placeholder="Simbolos, números y letras, sin blancos" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
                minLength={6}
                disabled={loading}
                className="rounded-xl h-12"
              />
            </div>

            {error && <p className="text-sm font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}

            <Button type="submit" size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold shadow-md shadow-indigo-200" disabled={loading || !password}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
