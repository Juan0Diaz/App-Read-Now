import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { isDemoMode, supabase } from '../lib/supabase';
import { ShieldAlert, BookOpen } from 'lucide-react';

export const Login = () => {
  const { user, simulateLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegister, setIsRegister] = useState(new URLSearchParams(location.search).get('register') === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  if (user) {
    return <Navigate to="/" />;
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Ingresa tu correo electrónico para recuperar la contraseña.');
      return;
    }
    setLoading(true);
    setError('');
    setResetMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setResetMessage('Revisa tu correo electrónico para el enlace de recuperación.');
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
    setResetMessage('');

    try {
      const blockKey = `login_block_${email.toLowerCase()}`;
      const attemptsKey = `login_attempts_${email.toLowerCase()}`;
      
      if (!isRegister) {
        const blockUntil = localStorage.getItem(blockKey);
        if (blockUntil && Date.now() < parseInt(blockUntil, 10)) {
          const remainingMinutes = Math.ceil((parseInt(blockUntil, 10) - Date.now()) / 60000);
          setError(`Demasiados intentos fallidos. Cuenta bloqueada temporalmente. Intenta en ${remainingMinutes} minuto(s).`);
          setLoading(false);
          return;
        }
      }

      if (isRegister) {
        if (!acceptTerms) {
          throw new Error('Debes aceptar los Términos y Condiciones y la Política de Privacidad.');
        }
        
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com)$/i;
        if (!emailRegex.test(email)) {
          throw new Error('Por favor, ingresa un correo con dominio @gmail.com o @outlook.com (sin caracteres especiales extra).');
        }

        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])[^\s]+$/;
        if (!passwordRegex.test(password)) {
          throw new Error('La contraseña debe contener letras, números y signos/caracteres especiales, y no debe contener espacios.');
        }

        if (!birthDate) {
          setError('Por favor, ingresa tu fecha de nacimiento.');
          setLoading(false);
          return;
        }

        const bd = new Date(birthDate);
        const today = new Date();
        if (bd > today) {
          setError('La fecha de nacimiento no puede ser una fecha futura.');
          setLoading(false);
          return;
        }
        
        let age = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) {
          age--;
        }
        
        if (age < 18) {
          setError('Debes ser mayor de 18 años para registrarte.');
          setLoading(false);
          return;
        }
      }

      if (isDemoMode) {
        // En modo demostración de AI Studio sin Credenciales, mockeamos login
        simulateLogin('Visualizador');
        navigate('/');
        return;
      }

      if (isRegister) {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('already registered')) {
            throw new Error('Este correo ya está registrado en el sistema (incluso si fue borrado previamente de la app). Por favor, intenta "Iniciar Sesión" con tus credenciales. La aplicación restaurará tu perfil automáticamente.');
          }
          throw signUpError;
        }

        if (authData.user) {
          const { error: dbError } = await supabase.from('Usuario').insert([
            { id_usuario: authData.user.id, correo: email, contrasena: password, fecha_date: birthDate }
          ]);
          if (dbError) {
            console.error("Error db:", dbError);
            throw new Error(`Error al insertar en tabla usuario: ${dbError.message}`);
          }
          
          let roleName = 'Visualizador';
          if (email.toLowerCase() === 'admin@gmail.com' || email.toLowerCase() === 'admin1@gmail.com') {
            roleName = 'Administrador';
          }
          
          const { data: roleAssigned } = await supabase.from('Rol').select('*').eq('nombre_Rol', roleName).maybeSingle();
          if (roleAssigned) {
            await supabase.from('Usuario-Rol').insert({ id_usuario: authData.user.id, id_Rol: roleAssigned.id_Rol });
          }
        }

        alert('Registro exitoso. Revisa tu correo o inicia sesión.');
        setIsRegister(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          const attempts = parseInt(localStorage.getItem(attemptsKey) || '0', 10) + 1;
          if (attempts >= 5) {
            localStorage.setItem(blockKey, (Date.now() + 5 * 60 * 1000).toString());
            localStorage.removeItem(attemptsKey);
            throw new Error('Demasiados intentos fallidos. Cuenta bloqueada temporalmente. Intenta en 5 minutos.');
          } else {
            localStorage.setItem(attemptsKey, attempts.toString());
            throw new Error(`Credenciales inválidas. Intento ${attempts} de 5.`);
          }
        }
        // Exito, borrar intentos
        localStorage.removeItem(attemptsKey);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          skipBrowserRedirect: true,
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        const popupWidth = 500;
        const popupHeight = 600;
        const left = window.screen.width / 2 - popupWidth / 2;
        const top = window.screen.height / 2 - popupHeight / 2;
        
        const popup = window.open(
          data.url, 
          'oauthPopup', 
          `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
        );
        
        if (!popup) {
          setError('Habilita las ventanas emergentes (popups) en tu navegador para continuar.');
          setLoading(false);
          return;
        }
        
        // Espera del mensaje de éxito de la ventana emergente.
        const handleMessage = (event: MessageEvent) => {
          
          if (event.origin !== window.location.origin) return;
          
          if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
            window.removeEventListener('message', handleMessage);
            clearInterval(popupTimer);
            
            // Esperar a que AuthContext detecte los cambios en la sesión y luego redirigir
            // Si el usuario navega demasiado pronto, es posible que el cambio no se refleje, pero AuthContext escucha el almacenamiento
            // Simplemente navegaremos a la página de inicio y la página detectará el cambio

            navigate('/');
          } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
            window.removeEventListener('message', handleMessage);
            clearInterval(popupTimer);
            setError(event.data.payload || 'Ocurrió un error en la autenticación.');
            setLoading(false);
          }
        };
        window.addEventListener('message', handleMessage);
        
        const popupTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(popupTimer);
            window.removeEventListener('message', handleMessage);
            setLoading(false);
          }
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || `Error al conectar con ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 w-full items-center justify-center -mt-10">
      <div className="w-full max-w-md mx-auto bg-white p-8 sm:p-10 border border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="h-16 w-16 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {isRegister ? 'Crear una cuenta' : 'Bienvenido de nuevo'}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">
            {isRegister ? 'Regístrate para acceder al catálogo virtual.' : 'Ingresa tus credenciales para continuar.'}
          </p>
        </div>

        {isDemoMode && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-sm flex items-start gap-3 shadow-sm">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold tracking-tight">Modo Demostración</p>
              <p className="mt-1 text-amber-700/80 leading-relaxed">
                Las credenciales de Supabase no están configuradas en las variables de entorno. 
                Puedes iniciar sesión como Visualizador, Publicador o Administrador haciendo clic en los botones debajo para probar la UI.
              </p>
              <div className="flex flex-wrap gap-2 mt-4 text-xs font-semibold">
                <Button size="sm" className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900" variant="outline" onClick={() => simulateLogin('Visualizador')} type="button">Visualizador</Button>
                <Button size="sm" className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900" variant="outline" onClick={() => simulateLogin('Publicador')} type="button">Publicador</Button>
                <Button size="sm" className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900" variant="outline" onClick={() => simulateLogin('Administrador')} type="button">Admin</Button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Correo Electrónico</label>
            <Input 
              type="email" 
              placeholder="tu@correo.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
              disabled={isDemoMode}
              className="rounded-xl h-12"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-bold text-slate-700">Contraseña</label>
              {!isRegister && !isDemoMode && (
                <button 
                  type="button" 
                  onClick={handleResetPassword}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 focus:outline-none focus:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <Input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isDemoMode}
              className="rounded-xl h-12"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Fecha de Nacimiento</label>
              <Input 
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                required={isRegister}
                disabled={isDemoMode}
                className="rounded-xl h-12"
              />
            </div>
          )}

          {isRegister && (
            <div className="flex items-start gap-2 mt-2">
              <input 
                type="checkbox" 
                id="terms" 
                checked={acceptTerms}
                onChange={e => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="terms" className="text-sm text-slate-600">
                Acepto los <button type="button" onClick={() => setShowTermsModal(true)} className="font-bold text-indigo-600 hover:underline">Términos y Condiciones</button> y la <button type="button" onClick={() => setShowTermsModal(true)} className="font-bold text-indigo-600 hover:underline">Política de Privacidad</button>
              </label>
            </div>
          )}

          {error && <p className="text-sm font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
          {resetMessage && <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">{resetMessage}</p>}

          <Button type="submit" size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 font-bold shadow-md shadow-indigo-200" disabled={loading || isDemoMode}>
            {loading ? 'Cargando...' : (isRegister ? 'Registrarse' : 'Iniciar sesión')}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="px-3 text-sm font-medium text-slate-400">o continuar con</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full rounded-xl h-12 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            disabled={loading || isDemoMode}
            onClick={() => handleOAuthLogin('google')}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full rounded-xl h-12 border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
            disabled={loading || isDemoMode}
            onClick={() => handleOAuthLogin('github')}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </Button>
        </div>

        <div className="mt-8 text-center text-sm font-medium text-slate-500">
          {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'} {' '}
          <button 
            onClick={() => setIsRegister(!isRegister)} 
            className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors focus:outline-none focus:underline"
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </div>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">Términos y Condiciones y Política de Privacidad</h2>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors p-2 shrink-0"
              >
                Cerrar
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-slate-700 leading-relaxed font-medium">
              <p>Al registrarse y utilizar la aplicación Biblioteca Virtual, el usuario acepta cumplir los presentes términos y condiciones de uso. En caso de no estar de acuerdo con alguna de las disposiciones establecidas, deberá abstenerse de utilizar la plataforma y sus servicios.</p>
              
              <p>La aplicación ReadNow es una plataforma digital diseñada para la visualización, publicación y gestión de libros digitales, permitiendo la interacción entre usuarios, publicadores y administradores. La plataforma actúa únicamente como intermediario tecnológico para facilitar el acceso y administración del contenido publicado dentro del sistema.</p>
              
              <p>Para acceder a determinadas funcionalidades, el usuario deberá registrarse proporcionando información verídica, actualizada y completa. Cada usuario será responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades realizadas desde su cuenta. La plataforma podrá suspender o eliminar cuentas que presenten información falsa, actividades sospechosas o comportamientos que afecten la seguridad del sistema.</p>
              
              <p>La aplicación contará con distintos roles dentro del sistema. El rol de visualizador tendrá acceso a la consulta de libros y administración de favoritos. El rol de publicador permitirá la creación, edición y eliminación de publicaciones propias. El rol de administrador tendrá control sobre la gestión de usuarios, moderación de contenido y administración general de la plataforma.</p>
              
              <p>Todo usuario que publique contenido dentro de la aplicación declara que posee los derechos necesarios sobre el material publicado o cuenta con autorización legal para distribuirlo. Asimismo, el usuario garantiza que las publicaciones realizadas no infringen derechos de autor, derechos de propiedad intelectual ni disposiciones legales vigentes. La plataforma no será responsable por infracciones cometidas por los usuarios relacionadas con propiedad intelectual o distribución no autorizada de contenido.</p>
              
              <p>Queda estrictamente prohibido publicar contenido ilegal, ofensivo, discriminatorio, fraudulento, malicioso o que contenga archivos dañinos para el sistema. También se prohíbe compartir contenido protegido por derechos de autor sin autorización correspondiente. El incumplimiento de estas disposiciones podrá ocasionar la suspensión temporal o permanente de la cuenta, así como la eliminación inmediata del contenido publicado.</p>
              
              <p>Todos los elementos pertenecientes a la plataforma, incluyendo diseño, estructura, interfaces, logotipo, funcionalidades y código fuente, se encuentran protegidos por derechos de propiedad intelectual. Los usuarios conservarán los derechos sobre el contenido original que publiquen dentro de la aplicación, siempre que dicho contenido no infrinja normativas legales o derechos de terceros.</p>
              
              <p>La plataforma implementará medidas de seguridad orientadas a proteger la información y los datos personales de los usuarios. Los datos recolectados serán utilizados exclusivamente para el funcionamiento de la aplicación, autenticación, gestión de cuentas y mejora del servicio. La información personal no será compartida con terceros sin autorización, salvo requerimiento legal o judicial.</p>
              
              <p>Aunque se implementarán mecanismos de seguridad y estabilidad, la plataforma no garantiza disponibilidad continua e ininterrumpida del servicio ni ausencia total de errores técnicos. La Biblioteca Virtual no será responsable por pérdidas de información ocasionadas por terceros, ataques informáticos, fallas externas o uso indebido de las cuentas por parte de los usuarios.</p>
              
              <p>Con el fin de garantizar la seguridad del sistema, se implementarán mecanismos como autenticación segura, validación de permisos por roles, protección de sesiones, validación de entradas y control de accesos. Los usuarios se comprometen a no intentar vulnerar la seguridad de la plataforma, acceder sin autorización a información restringida o realizar actividades que comprometan el funcionamiento del sistema.</p>
              
              <p>La plataforma podrá suspender o eliminar cuentas cuando se detecten actividades fraudulentas, incumplimiento de estos términos y condiciones, infracciones legales o publicación de contenido prohibido. Asimismo, el administrador tendrá facultades para moderar publicaciones y gestionar usuarios cuando sea necesario para preservar la integridad de la aplicación.</p>
              
              <p>ReadNow podrá modificar los presentes términos y condiciones en cualquier momento con el fin de actualizar políticas, mejorar la seguridad o adaptarse a nuevas disposiciones legales. Será responsabilidad del usuario revisar periódicamente dichas modificaciones.</p>
              
              <p>La plataforma se regirá por la legislación vigente aplicable en materia de protección de datos personales, propiedad intelectual, servicios digitales y comercio electrónico. Cualquier conflicto derivado del uso de la aplicación será tratado conforme a las leyes aplicables en la jurisdicción correspondiente.</p>
              
              <p>Como medida preventiva para evitar problemas legales y técnicos, la aplicación deberá implementar validaciones de archivos, restricciones de formatos permitidos, límites de tamaño de carga, registros de actividad de usuarios, validaciones de permisos antes de operaciones críticas y mecanismos de recuperación de cuenta. Además, se recomienda utilizar estrategias de “soft delete” para usuarios y libros, permitiendo conservar registros históricos en caso de auditorías o recuperación de información.</p>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end shrink-0 bg-slate-50">
              <Button onClick={() => setShowTermsModal(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
