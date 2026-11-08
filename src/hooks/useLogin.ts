import { useState } from 'react';
import {
  sendPasswordReset,
  signIn,
  signUp,
  startOAuth,
} from '../microservicios/Login';

interface LoginFormValues {
  isRegister: boolean;
  email: string;
  password: string;
  birthDate: string;
  acceptedTerms: boolean;
}

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const submit = async (
    values: LoginFormValues,
    onLoginSuccess: () => void,
    onRegisterSuccess: () => void,
  ) => {
    setLoading(true);
    setError('');
    setResetMessage('');

    try {
      if (values.isRegister) {
        await signUp(values.email, values.password, values.birthDate, values.acceptedTerms);
        onRegisterSuccess();
      } else {
        await signIn(values.email, values.password);
        onLoginSuccess();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (!email) {
      setError('Ingresa tu correo electrónico para recuperar la contraseña.');
      return;
    }

    setLoading(true);
    setError('');
    setResetMessage('');
    try {
      await sendPasswordReset(email);
      setResetMessage('Revisa tu correo electrónico para el enlace de recuperación.');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Error al enviar recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithOAuth = async (
    provider: 'google' | 'github',
  ) => {
    setLoading(true);
    setError('');

    try {
      await startOAuth(provider);
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : `Error al conectar con ${provider}`);
      setLoading(false);
    }
  };

  return { loading, error, resetMessage, submit, resetPassword, loginWithOAuth };
}