import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LogOut, User as UserIcon, Shield, Mail, Edit2, Save, X, AlertTriangle, Moon, Sun } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

export const Profile = () => {
  const { user, role, signOut, fetchUserData } = useAuth();
  const navigate = useNavigate();
  const { isDark, setIsDark } = useDarkMode();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRoleChangeConfirm, setShowRoleChangeConfirm] = useState(false);
  const [roleChangeBookCount, setRoleChangeBookCount] = useState(0);
  
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [fechaDate, setFechaDate] = useState(user?.fecha_date || '');
  
  const parseInitialPhone = (phone: string | null) => {
    if (!phone) return { code: '+57', num: '' };
    const codes = ['+57', '+1', '+52', '+34', '+54', '+56', '+51', '+593'];
    for (const c of codes) {
      if (phone.startsWith(c)) return { code: c, num: phone.slice(c.length) };
    }
    return { code: '+57', num: phone };
  };
  const initialPhone = parseInitialPhone(user?.numero_tel || null);
  const [countryCode, setCountryCode] = useState(initialPhone.code);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.num);
  
  const roles = [
    { id: 'cb815a38-b6a4-4197-970a-0c0e572767d7', nombre: 'Publicador' },
    { id: 'ca2b6f7f-a5f6-4beb-9e35-afce235956a7', nombre: 'Visualizador' }
  ];
  
  const initialRoleId = roles.find(r => r.nombre === role)?.id || roles[1].id;
  const [selectedRole, setSelectedRole] = useState<string>(initialRoleId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedRole(roles.find(r => r.nombre === role)?.id || roles[1].id);
  }, [role]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Manual cascade delete
      await supabase.from('Favoritos').delete().eq('id_usuario', user.id_usuario);
      await supabase.from('Publicacion').delete().eq('id_usuario', user.id_usuario);
      await supabase.from('Usuario-Rol').delete().eq('id_usuario', user.id_usuario);
      const { error } = await supabase.from('Usuario').delete().eq('id_usuario', user.id_usuario);
      
      if (error) throw error;
      
      await signOut();
      navigate('/login');
    } catch (err: any) {
      alert('Error eliminando la cuenta: ' + err.message);
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setProfileError('');
    
    if (nombre && nombre.length > 50) {
      setProfileError("Error: El nombre excede el límite máximo permitido de 50 caracteres.");
      return;
    }

    if (fechaDate) {
      const birthDate = new Date(fechaDate);
      const today = new Date();
      if (birthDate > today) {
        setProfileError("Error: La fecha de nacimiento no puede ser una fecha futura.");
        return;
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        setProfileError("Error: Debes ser mayor de 18 años para registrarte.");
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('Usuario').update({
        nombre: nombre,
        fecha_date: fechaDate || null,
        numero_tel: phoneNumber ? `${countryCode}${phoneNumber}` : null
      }).eq('id_usuario', user.id_usuario);
      
      if (error) throw error;
      await fetchUserData(user.id_usuario, user.correo);
      setIsEditingProfile(false);
    } catch(err: any) {
      setProfileError("Error al actualizar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async () => {
    if (!user || !user.correo) return;
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.correo, password: currentPassword });
      if (signInError) throw new Error("La contraseña actual es incorrecta.");
      
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])[^\s]+$/;
      if (!passwordRegex.test(newPassword)) {
        throw new Error('La nueva contraseña debe contener letras, números y signos/caracteres especiales, y no debe contener espacios.');
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      
      await supabase.from('Usuario').update({ contrasena: newPassword }).eq('id_usuario', user.id_usuario);
      
      alert("Contraseña actualizada con éxito.");
      setIsEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch(err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveRole = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const newRoleObj = roles.find(r => r.id === selectedRole);
      
      if (newRoleObj?.nombre === 'Visualizador' && role === 'Publicador') {
        const { count } = await supabase.from('Publicacion').select('*', { count: 'exact', head: true }).eq('id_usuario', user.id_usuario);
        if (count && count > 0) {
          setRoleChangeBookCount(count);
          setShowRoleChangeConfirm(true);
          setLoading(false);
          return;
        }
      }

      await executeRoleChange();
    } catch(err: any) {
      alert("Error al verificar cambio de rol: " + err.message);
      setLoading(false);
    }
  };

  const executeRoleChange = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Role table update logic
      // First check if role exists for user
      const { data: existing } = await supabase.from('Usuario-Rol').select('*').eq('id_usuario', user.id_usuario).maybeSingle();
      
      if (existing) {
        const { error } = await supabase.from('Usuario-Rol').update({
          id_Rol: selectedRole
        }).eq('id_usuario', user.id_usuario);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('Usuario-Rol').insert([{
          id_usuario: user.id_usuario,
          id_Rol: selectedRole
        }]);
        if (error) throw error;
      }
      
      await fetchUserData(user.id_usuario, user.correo);
      setIsEditingRole(false);
      setShowRoleChangeConfirm(false);
    } catch(err: any) {
      alert("Error al actualizar rol: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center shrink-0 sticky top-0 z-10 w-full">
        <h1 className="text-xl font-bold text-slate-900">Perfil de Usuario</h1>
      </header>

      <div className="p-4 md:p-8 flex-1 overflow-y-auto w-full mx-auto md:max-w-4xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-24 md:h-32 w-full relative">
          </div>
          <div className="p-6 md:p-8 pt-0 relative">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end -mt-12 md:-mt-16 mb-4 gap-4">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1.5 md:p-2 shadow-lg shrink-0">
                <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold text-indigo-700">
                  {user?.correo?.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <Button 
                  onClick={() => setIsDark(!isDark)} 
                  variant="outline" 
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 font-bold w-full md:w-auto"
                >
                  {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {isDark ? 'Modo Claro' : 'Modo Oscuro'}
                </Button>
                <Button onClick={handleLogout} variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold w-full md:w-auto">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-1">{user?.nombre || user?.correo?.split('@')[0]}</h2>
              <div className="flex items-center gap-2 text-slate-500 mb-6">
                <Mail className="h-4 w-4" />
                <span>{user?.correo}</span>
              </div>

              {isEditingRole ? (
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl mb-8 flex items-center gap-4">
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none"
                    disabled={loading}
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                  <Button onClick={saveRole} disabled={loading} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Save className="h-4 w-4 mr-2" /> Guardar
                  </Button>
                  <Button onClick={() => setIsEditingRole(false)} disabled={loading} size="sm" variant="ghost">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl inline-flex font-semibold">
                    <Shield className="h-5 w-5" />
                    <span>Rol actual: {role}</span>
                  </div>
                  {role !== 'Desactivado' && (
                    <Button onClick={() => setIsEditingRole(true)} variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600">
                      <Edit2 className="h-4 w-4 mr-1" /> Editar
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xl font-bold text-slate-900">Información del Perfil</h3>
                {!isEditingProfile && (
                  <Button onClick={() => setIsEditingProfile(true)} variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600">
                    <Edit2 className="h-4 w-4 mr-1" /> Editar Perfil
                  </Button>
                )}
              </div>
              
              {isEditingProfile ? (
                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                      <Input 
                        value={nombre} 
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                          if (val.length <= 50) {
                            setNombre(val);
                          }
                        }} 
                        maxLength={50}
                        disabled={loading} 
                        className={`bg-white ${nombre.length >= 50 ? 'border-amber-400 focus:ring-amber-500' : ''}`}
                        placeholder="Tu nombre completo"
                      />
                      {nombre.length >= 50 && (
                        <p className="text-xs text-amber-600 mt-1 font-semibold">
                          Has alcanzado el límite máximo de 50 caracteres.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                      <Input 
                        type="date" 
                        value={fechaDate} 
                        onChange={(e) => setFechaDate(e.target.value)} 
                        disabled={loading}
                        className="bg-white"
                      />
                    </div>
                    {role === 'Publicador' && (
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Número de Teléfono (Contacto)</label>
                        <div className="flex gap-2">
                          <select 
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            disabled={loading}
                            className="bg-white border border-slate-200 rounded-xl px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-28 shrink-0 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiBoZWlnaHQ9IjIwIiB2aWV3Qm94PSIwIDAgMjAgMjAiIHdpZHRoPSIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSA3LjVMMTAgMTIuNUwxNSA3LjUiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg==')] bg-no-repeat bg-[position:right_0.5rem_center]"
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
                            type="tel" 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                            disabled={loading}
                            className="bg-white flex-1"
                            placeholder="Ej: 3001234567"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {profileError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-sm font-semibold">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <p>{profileError}</p>
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button onClick={() => setIsEditingProfile(false)} disabled={loading} variant="outline">
                      Cancelar
                    </Button>
                    <Button onClick={saveProfile} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                      {user?.nombre || 'No especificado'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-slate-500">
                      {user?.correo} {/* Read-only */}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Nacimiento</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                      {user?.fecha_date ? new Date(user.fecha_date).toLocaleDateString() : 'No especificada'}
                    </div>
                  </div>
                  {role === 'Publicador' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Número de Teléfono</label>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                        {user?.numero_tel || 'No especificado'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xl font-bold text-slate-900">Seguridad</h3>
                {!isEditingPassword && (
                  <Button onClick={() => setIsEditingPassword(true)} variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600">
                    <Edit2 className="h-4 w-4 mr-1" /> Cambiar Contraseña
                  </Button>
                )}
              </div>
              
              {isEditingPassword && (
                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña Actual</label>
                      <Input 
                        type="password"
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        disabled={loading} 
                        className="bg-white"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Nueva Contraseña</label>
                      <Input 
                        type="password"
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        disabled={loading}
                        className="bg-white"
                        placeholder="Simbolos, números y letras, sin blancos"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button onClick={() => { setIsEditingPassword(false); setCurrentPassword(""); setNewPassword(""); }} disabled={loading} variant="outline">
                      Cancelar
                    </Button>
                    <Button onClick={savePassword} disabled={loading || !currentPassword || !newPassword} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      {loading ? 'Guardando...' : 'Cambiar Contraseña'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {role !== 'Administrador' && (
              <div className="mt-12 pt-8 border-t border-slate-200 text-center">
                <Button 
                  onClick={() => setShowDeleteConfirm(true)} 
                  variant="outline" 
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                  Eliminar Mi Cuenta
                </Button>
              </div>
            )}
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
