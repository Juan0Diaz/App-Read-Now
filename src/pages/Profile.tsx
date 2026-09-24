import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LogOut, User as UserIcon, Shield, Mail, Edit2, Save, X, AlertTriangle, Moon, Sun } from 'lucide-react';
import { Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import { useProfile } from '../hooks/useProfile';

export const Profile = () => {
  const { user, role, signOut, fetchUserData } = useAuth();
  const navigate = useNavigate();
  const { isDark, setIsDark } = useDarkMode();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [fechaDate, setFechaDate] = useState(user?.fecha_date || '');

  const {
    loading,
    profileError,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showRoleChangeConfirm,
    setShowRoleChangeConfirm,
    roleChangeBookCount,
    parseInitialPhone,
    handleDeleteAccount: deleteAccount,
    saveProfile: saveProfileAction,
    savePassword: savePasswordAction,
    saveRole: saveRoleAction,
    executeRoleChange: executeRoleChangeAction,
  } = useProfile(user, role, fetchUserData, signOut, navigate);

  const initialPhone = parseInitialPhone(user?.numero_tel || null);
  const [countryCode, setCountryCode] = useState(initialPhone.code);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.num);

  const roles: { nombre: 'Publicador' | 'Visualizador' }[] = [
    { nombre: 'Publicador' },
    { nombre: 'Visualizador' },
  ];

  const [selectedRole, setSelectedRole] = useState<'Publicador' | 'Visualizador'>(
    role === 'Publicador' ? 'Publicador' : 'Visualizador',
  );

  useEffect(() => {
    setSelectedRole(role === 'Publicador' ? 'Publicador' : 'Visualizador');
  }, [role]);

  const profileInitial = (user?.nombre || user?.correo || 'U').charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    setShowDeleteConfirm(false);
  };

  const saveProfile = async () => {
    await saveProfileAction(nombre, fechaDate, countryCode, phoneNumber);
    setIsEditingProfile(false);
  };

  const savePassword = async () => {
    const ok = await savePasswordAction(currentPassword, newPassword);
    if (ok) {
      setIsEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  const saveRole = async () => {
    await saveRoleAction(selectedRole);
    setIsEditingRole(false);
  };

  const executeRoleChange = async () => {
    await executeRoleChangeAction(selectedRole);
    setIsEditingRole(false);
    setShowRoleChangeConfirm(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-surface-soft text-text-strong animate-in fade-in duration-500">
      <header className="page-header-surface sticky top-0 z-10 h-20 w-full shrink-0 px-8 shadow-sm">
        <h1 className="flex h-full items-center text-2xl font-bold tracking-tight text-text-strong dark:text-white">Perfil de Usuario</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl p-4 md:p-8">
          <div className="mb-8 w-full overflow-hidden rounded-3xl border border-border bg-surface shadow-md">
            <div className="relative h-24 w-full bg-gradient-to-r from-primary to-secondary md:h-32" />
            <div className="relative p-6 pt-0 md:p-8 md:pt-0">
              <div className="mb-4 flex -mt-12 flex-col gap-4 md:-mt-16 md:flex-row md:items-end md:justify-between">
                <div className="h-24 w-24 shrink-0 rounded-full border-4 border-white bg-primary p-1.5 shadow-lg md:h-32 md:w-32 md:p-2 dark:border-slate-900">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-black dark:bg-primary/30 dark:text-white md:text-4xl">
                    {profileInitial}
                  </div>
                </div>

                <div className="flex w-full flex-col items-center gap-3 md:w-auto md:flex-row">
                  <Button
                    onClick={() => setIsDark(!isDark)}
                    variant="outline"
                    aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
                    aria-pressed={isDark}
                    className="w-full border-primary/20 text-primary hover:bg-primary/5 hover:text-primary md:w-auto"
                  >
                    {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    {isDark ? 'Modo Claro' : 'Modo Oscuro'}
                  </Button>
                  <Button onClick={handleLogout} variant="outline" className="w-full border-error/20 text-error hover:bg-error/10 hover:text-error md:w-auto">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </div>
              </div>

              <div>
                <h2 className="mb-1 text-3xl font-bold text-text-strong">{user?.nombre || user?.correo?.split('@')[0]}</h2>
                <div className="mb-6 flex items-center gap-2 text-text-muted">
                  <Mail className="h-4 w-4" />
                  <span>{user?.correo}</span>
                </div>

                {isEditingRole ? (
                  <div className="mb-8 flex items-center gap-4 rounded-xl border border-border bg-surface-soft p-4">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'Publicador' | 'Visualizador')}
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-text-strong outline-none focus:border-primary"
                      disabled={loading}
                    >
                      {roles.map((r) => (
                        <option key={r.nombre} value={r.nombre}>{r.nombre}</option>
                      ))}
                    </select>
                    <Button onClick={saveRole} aria-label="Guardar rol de usuario" disabled={loading} size="sm" variant="accent">
                      <Save className="mr-2 h-4 w-4" /> Guardar
                    </Button>
                    <Button onClick={() => setIsEditingRole(false)} aria-label="Cancelar edición de rol" disabled={loading} size="sm" variant="ghost">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="mb-8 flex items-center gap-4">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-secondary/10 px-4 py-2 font-semibold text-secondary">
                      <Shield className="h-5 w-5" />
                      <span>Rol actual: {role}</span>
                    </div>
                    {role !== 'Desactivado' && (
                      <Button onClick={() => setIsEditingRole(true)} aria-label="Editar rol de usuario" variant="ghost" size="sm" className="text-primary hover:text-primary-hover">
                        <Edit2 className="mr-1 h-4 w-4" /> Editar
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-xl font-bold text-text-strong">Información del Perfil</h3>
                  {!isEditingProfile && (
                    <Button onClick={() => setIsEditingProfile(true)} aria-label="Editar información de perfil" variant="ghost" size="sm" className="text-primary hover:text-primary-hover">
                      <Edit2 className="mr-1 h-4 w-4" /> Editar Perfil
                    </Button>
                  )}
                </div>

                {isEditingProfile ? (
                  <div className="space-y-4 rounded-2xl border border-border bg-surface-soft p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label htmlFor="profile-name" className="mb-1 block text-sm font-bold text-text-body">Nombre</label>
                        <Input
                          id="profile-name"
                          value={nombre}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                            if (val.length <= 50) {
                              setNombre(val);
                            }
                          }}
                          maxLength={50}
                          disabled={loading}
                          className={`bg-surface ${nombre.length >= 50 ? 'border-warning focus:ring-warning' : ''}`}
                          placeholder="Tu nombre completo"
                        />
                        {nombre.length >= 50 && (
                          <p className="mt-1 text-xs font-semibold text-warning">
                            Has alcanzado el límite máximo de 50 caracteres.
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="profile-date" className="mb-1 block text-sm font-bold text-text-body">Fecha de Nacimiento</label>
                        <Input
                          id="profile-date"
                          type="date"
                          value={fechaDate}
                          onChange={(e) => setFechaDate(e.target.value)}
                          disabled={loading}
                          className="bg-surface"
                        />
                      </div>
                      {role === 'Publicador' && (
                        <div className="sm:col-span-2">
                          <label htmlFor="profile-phone" className="mb-1 block text-sm font-bold text-text-body">Número de Teléfono (Contacto)</label>
                          <div className="flex gap-2">
                            <select
                              id="profile-phone-country"
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              disabled={loading}
                              className="w-28 shrink-0 appearance-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-strong outline-none focus:border-primary"
                            >
                              <option value="+57">🇨🇴 +57</option>
                              <option value="+1">🇺🇸 +1</option>
                              <option value="+52">🇲🇽 +52</option>
                              <option value="+34">🇪🇸 +34</option>
                              <option value="+54">🇦🇷 +54</option>
                              <option value="+56">🇨🇱 +56</option>
                              <option value="+51">🇵🇪 +51</option>
                              <option value="+593">🇪🇨 +593</option>
                            </select>
                            <Input
                              id="profile-phone"
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                              disabled={loading}
                              className="flex-1 bg-surface"
                              placeholder="Ej: 3001234567"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {profileError && (
                      <div className="flex items-center gap-2 rounded-xl border border-error/20 bg-error/10 p-3 text-sm font-semibold text-error">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <p>{profileError}</p>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                      <Button onClick={() => setIsEditingProfile(false)} disabled={loading} variant="outline">
                        Cancelar
                      </Button>
                      <Button onClick={saveProfile} aria-label="Guardar cambios del perfil" disabled={loading} variant="accent">
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="profile-name-display" className="mb-1 block text-sm font-bold text-text-body">Nombre</label>
                      <div id="profile-name-display" className="rounded-xl border border-border bg-surface-soft p-3 text-text-strong">
                        {user?.nombre || 'No especificado'}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="profile-email-display" className="mb-1 block text-sm font-bold text-text-body">Correo Electrónico</label>
                      <div id="profile-email-display" className="rounded-xl border border-border bg-surface-soft p-3 text-text-muted">
                        {user?.correo}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="profile-date-display" className="mb-1 block text-sm font-bold text-text-body">Fecha de Nacimiento</label>
                      <div id="profile-date-display" className="rounded-xl border border-border bg-surface-soft p-3 text-text-strong">
                        {user?.fecha_date ? new Date(user.fecha_date).toLocaleDateString() : 'No especificada'}
                      </div>
                    </div>
                    {role === 'Publicador' && (
                      <div>
                        <label htmlFor="profile-phone-display" className="mb-1 block text-sm font-bold text-text-body">Número de Teléfono</label>
                        <div id="profile-phone-display" className="rounded-xl border border-border bg-surface-soft p-3 text-text-strong">
                          {user?.numero_tel || 'No especificado'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-text-strong">Seguridad</h3>
                  {!isEditingPassword && (
                    <Button onClick={() => setIsEditingPassword(true)} aria-label="Cambiar contraseña" variant="ghost" size="sm" className="text-primary hover:text-primary-hover">
                      <Edit2 className="mr-1 h-4 w-4" /> Cambiar Contraseña
                    </Button>
                  )}
                </div>

                {isEditingPassword && (
                  <div className="space-y-4 rounded-2xl border border-border bg-surface-soft p-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label htmlFor="current-password" className="mb-1 block text-sm font-bold text-text-body">Contraseña Actual</label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={loading}
                          className="bg-surface"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label htmlFor="new-password" className="mb-1 block text-sm font-bold text-text-body">Nueva Contraseña</label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={loading}
                          className="bg-surface"
                          placeholder="Símbolos, números y letras, sin blancos"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button onClick={() => { setIsEditingPassword(false); setCurrentPassword(''); setNewPassword(''); }} disabled={loading} variant="outline">
                        Cancelar
                      </Button>
                      <Button onClick={savePassword} aria-label="Guardar nueva contraseña" disabled={loading || !currentPassword || !newPassword} variant="accent">
                        {loading ? 'Guardando...' : 'Cambiar Contraseña'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {role !== 'Administrador' && (
                <div className="mt-8 text-center">
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="outline"
                    className="border-error/20 text-error hover:bg-error/10 hover:text-error"
                  >
                    Eliminar Mi Cuenta
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRoleChangeConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-center mb-4 text-emerald-500">
              <Shield className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">Cambiar Rol a Visualizador</h3>
            <p className="text-slate-600 text-sm mb-6 text-center whitespace-pre-line">
              Tienes {roleChangeBookCount} libro(s) publicado(s). Al cambiar tu rol a Visualizador, ya no podrás gestionar tus libros. Estos quedarán al manejo de los Administradores.

              Sin embargo, si en el futuro vuelves a cambiar tu rol a Publicador, se te devolverá el acceso a gestionarlos.

              ¿Estás seguro de que deseas proceder?
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={executeRoleChange}
                disabled={loading}
              >
                {loading ? 'Cambiando...' : 'Sí, cambiar rol'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowRoleChangeConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-center mb-4 text-rose-500">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">¿Eliminar tu cuenta?</h3>
            <p className="text-slate-600 text-sm mb-6 text-center">
              Esta acción es irreversible. Se eliminará permanentemente tu usuario y todos los datos asociados de la base de datos.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
