import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { actualizarMiPerfil, cambiarMiRol, eliminarMiCuenta } from '../microservicios/Usuarios';
import { getMisPublicaciones } from '../microservicios/Publicaciones';
import { Role } from '../types';

export function useProfile(
  user: any,
  role: Role | null,
  fetchUserData: (idUsuario: string, correo: string) => Promise<void>,
  signOut: () => Promise<void>,
  navigate: (path: string) => void,
) {
  const [loading, setLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRoleChangeConfirm, setShowRoleChangeConfirm] = useState(false);
  const [roleChangeBookCount, setRoleChangeBookCount] = useState(0);

  const parseInitialPhone = useCallback((phone: string | null) => {
    if (!phone) return { code: '+57', num: '' };
    const codes = ['+57', '+1', '+52', '+34', '+54', '+56', '+51', '+593'];
    for (const c of codes) {
      if (phone.startsWith(c)) return { code: c, num: phone.slice(c.length) };
    }
    return { code: '+57', num: phone };
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      await eliminarMiCuenta();
      await signOut();
      navigate('/login');
    } catch (err: any) {
      alert('Error eliminando la cuenta: ' + err.message);
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  }, [navigate, signOut, user]);

  const saveProfile = useCallback(async (
    nombre: string,
    fechaDate: string,
    countryCode: string,
    phoneNumber: string,
  ) => {
    if (!user) return;
    setProfileError('');

    if (nombre && nombre.length > 50) {
      setProfileError('Error: El nombre excede el límite máximo permitido de 50 caracteres.');
      return;
    }

    if (fechaDate) {
      const birthDate = new Date(fechaDate);
      const today = new Date();
      if (birthDate > today) {
        setProfileError('Error: La fecha de nacimiento no puede ser una fecha futura.');
        return;
      }

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        setProfileError('Error: Debes ser mayor de 18 años para registrarte.');
        return;
      }
    }

    setLoading(true);
    try {
      await actualizarMiPerfil({
        nombre: nombre || undefined,
        fecha_date: fechaDate || undefined,
        numero_tel: phoneNumber ? `${countryCode}${phoneNumber}` : undefined,
      });
      await fetchUserData(user.id_usuario, user.correo);
    } catch (err: any) {
      setProfileError('Error al actualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, user]);

  const savePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user || !user.correo) return false;
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.correo,
        password: currentPassword,
      });
      if (signInError) throw new Error('La contraseña actual es incorrecta.');

      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])[^\s]+$/;
      if (!passwordRegex.test(newPassword)) {
        throw new Error('La nueva contraseña debe contener letras, números y signos/caracteres especiales, y no debe contener espacios.');
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      alert('Contraseña actualizada con éxito.');
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const executeRoleChange = useCallback(async (selectedRole: 'Publicador' | 'Visualizador') => {
    if (!user) return;
    setLoading(true);

    try {
      await cambiarMiRol(selectedRole);
      await fetchUserData(user.id_usuario, user.correo);
      setShowRoleChangeConfirm(false);
    } catch (err: any) {
      alert('Error al actualizar rol: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, user]);

  const saveRole = useCallback(async (selectedRole: 'Publicador' | 'Visualizador') => {
    if (!user) return;
    setLoading(true);

    try {
      if (selectedRole === 'Visualizador' && role === 'Publicador') {
        const misPublicaciones = await getMisPublicaciones();
        if (misPublicaciones.length > 0) {
          setRoleChangeBookCount(misPublicaciones.length);
          setShowRoleChangeConfirm(true);
          return;
        }
      }

      await executeRoleChange(selectedRole);
    } catch (err: any) {
      alert('Error al verificar cambio de rol: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [executeRoleChange, role, user]);

  return {
    loading,
    profileError,
    setProfileError,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showRoleChangeConfirm,
    setShowRoleChangeConfirm,
    roleChangeBookCount,
    setRoleChangeBookCount,
    parseInitialPhone,
    handleDeleteAccount,
    saveProfile,
    savePassword,
    saveRole,
    executeRoleChange,
  };
}
