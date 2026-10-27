import { ApiError, request } from '../lib/api';
import { isDemoMode, supabase } from '../lib/supabase';
import { Role, User } from '../types';

export interface LoginProfile extends User {
	rol: Role;
}

const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com)$/i;
const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])[^\s]+$/;

export async function getAuthenticatedProfile(): Promise<LoginProfile | null> {
	if (isDemoMode) return null;

	try {
		return await request<LoginProfile>('/api/login/me');
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) return null;
		throw error;
	}
}

export async function signIn(email: string, password: string): Promise<void> {
	const normalizedEmail = email.toLowerCase();
	const blockKey = `login_block_${normalizedEmail}`;
	const attemptsKey = `login_attempts_${normalizedEmail}`;
	const blockUntil = Number(localStorage.getItem(blockKey));

	if (blockUntil && Date.now() < blockUntil) {
		const remainingMinutes = Math.ceil((blockUntil - Date.now()) / 60000);
		throw new Error(`Demasiados intentos fallidos. Cuenta bloqueada temporalmente. Intenta en ${remainingMinutes} minuto(s).`);
	}

	const { error } = await supabase.auth.signInWithPassword({ email, password });
	if (error) {
		const attempts = Number(localStorage.getItem(attemptsKey) || '0') + 1;
		if (attempts >= 5) {
			localStorage.setItem(blockKey, (Date.now() + 5 * 60 * 1000).toString());
			localStorage.removeItem(attemptsKey);
			throw new Error('Demasiados intentos fallidos. Cuenta bloqueada temporalmente. Intenta en 5 minutos.');
		}

		localStorage.setItem(attemptsKey, attempts.toString());
		throw new Error(`Credenciales inválidas. Intento ${attempts} de 5.`);
	}

	localStorage.removeItem(attemptsKey);
}

export async function signUp(
	email: string,
	password: string,
	birthDate: string,
	acceptedTerms: boolean,
): Promise<void> {
	if (!acceptedTerms) {
		throw new Error('Debes aceptar los Términos y Condiciones y la Política de Privacidad.');
	}
	if (!emailPattern.test(email)) {
		throw new Error('Por favor, ingresa un correo con dominio @gmail.com o @outlook.com (sin caracteres especiales extra).');
	}
	if (!passwordPattern.test(password)) {
		throw new Error('La contraseña debe contener letras, números y signos/caracteres especiales, y no debe contener espacios.');
	}
	if (!birthDate) {
		throw new Error('Por favor, ingresa tu fecha de nacimiento.');
	}

	const [year, month, day] = birthDate.split('-').map(Number);
	const today = new Date();
	const birthday = new Date(year, month - 1, day);
	if (Number.isNaN(birthday.getTime()) || birthday > today) {
		throw new Error('La fecha de nacimiento no puede ser una fecha futura.');
	}

	let age = today.getFullYear() - birthday.getFullYear();
	if (today.getMonth() < birthday.getMonth() ||
			(today.getMonth() === birthday.getMonth() && today.getDate() < birthday.getDate())) {
		age--;
	}
	if (age < 18) {
		throw new Error('Debes ser mayor de 18 años para registrarte.');
	}

	const { data, error } = await supabase.auth.signUp({ email, password });
	if (error) {
		if (error.message.toLowerCase().includes('already registered')) {
			throw new Error('Este correo ya está registrado en el sistema (incluso si fue borrado previamente de la app). Por favor, intenta "Iniciar Sesión" con tus credenciales. La aplicación restaurará tu perfil automáticamente.');
		}
		throw error;
	}

	if (!data.user) return;

	const { error: profileError } = await supabase.from('Usuario').insert([{
		id_usuario: data.user.id,
		correo: email,
		contrasena: 'N/A: SUPABASE AUTH',
		fecha_date: birthDate,
	}]);
	if (profileError) {
		throw new Error(`Error al insertar en tabla usuario: ${profileError.message}`);
	}

	const roleName = ['admin@gmail.com', 'admin1@gmail.com'].includes(email.toLowerCase())
		? 'Administrador'
		: 'Visualizador';
	const { data: role } = await supabase
		.from('Rol')
		.select('*')
		.eq('nombre_Rol', roleName)
		.maybeSingle();

	if (role) {
		const { error: roleError } = await supabase
			.from('Usuario-Rol')
			.insert({ id_usuario: data.user.id, id_Rol: role.id_Rol });
		if (roleError) throw roleError;
	}
}

export async function sendPasswordReset(email: string): Promise<void> {
	const { error } = await supabase.auth.resetPasswordForEmail(email, {
		redirectTo: `${window.location.origin}/reset-password`,
	});
	if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
	const { data, error: sessionError } = await supabase.auth.getSession();
	if (sessionError) throw sessionError;
	if (!data.session) {
		throw new Error('El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.');
	}

	const { error } = await supabase.auth.updateUser({ password });
	if (error) throw error;
}

export async function startOAuth(provider: 'google' | 'github'): Promise<string | null> {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: {
			redirectTo: `${window.location.origin}/auth/callback`,
			skipBrowserRedirect: true,
		},
	});

	if (error) throw error;
	return data.url;
}
