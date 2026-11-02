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
    onLoginSuccess: () => void,
  ) => {
    setLoading(true);
    setError('');

    try {
      const url = await startOAuth(provider);
      if (!url) {
        setLoading(false);
        return;
      }

      const popupWidth = 500;
      const popupHeight = 600;
      const left = window.screen.width / 2 - popupWidth / 2;
      const top = window.screen.height / 2 - popupHeight / 2;
      const popup = window.open(
        url,
        'oauthPopup',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`,
      );

      if (!popup) {
        setError('Habilita las ventanas emergentes (popups) en tu navegador para continuar.');
        setLoading(false);
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          window.clearInterval(popupTimer);
          onLoginSuccess();
        } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          window.clearInterval(popupTimer);
          setError(event.data.payload || 'Ocurrió un error en la autenticación.');
          setLoading(false);
        }
      };
      window.addEventListener('message', handleMessage);

      const popupTimer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(popupTimer);
          window.removeEventListener('message', handleMessage);
          setLoading(false);
        }
      }, 500);
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : `Error al conectar con ${provider}`);
      setLoading(false);
    }
  };

  return { loading, error, resetMessage, submit, resetPassword, loginWithOAuth };
}