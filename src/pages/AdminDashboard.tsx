import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { getUsuarios, asignarRol } from '../lib/api';
import { User } from '../types';
import { AlertTriangle } from 'lucide-react';

export const AdminDashboard = () => {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (u: User) => u.roles?.[0]?.rol?.nombre_Rol || 'Sin Rol';

  // Antes, esta función hacía todo el trabajo desde el frontend: buscar el id
  // del rol "Visualizador"/"Desactivado", decidir si insertar o actualizar en
  // Usuario-Rol, y (al desactivar) borrar los favoritos por separado. Ahora
  // solo le dice al backend qué rol asignar; el resto vive en un solo lugar
  // (UsuariosController.AssignRole), dentro de una transacción.
  const handleRoleChange = async (userId: string, currentRole: string) => {
    if (currentRole === 'Desactivado') {
      try {
        setActionLoading(true);
        await asignarRol(userId, 'Visualizador');
        await fetchUsers();
      } catch (err: any) {
        console.error(err);
        alert('Error updating user role: ' + (err.message || 'Unknown error'));
      } finally {
        setActionLoading(false);
      }
    } else {
      setDeactivateConfirm(userId);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateConfirm) return;
    try {
      setActionLoading(true);
      await asignarRol(deactivateConfirm, 'Desactivado');
      setDeactivateConfirm(null);
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert('Error updating user role: ' + (err.message || 'Unknown error'));
      setDeactivateConfirm(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user || role !== 'Administrador') {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center shrink-0 sticky top-0 z-10 w-full">
        <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
      </header>

      <div className="p-8 flex-1 overflow-y-auto max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Usuarios</h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden">
          {loading ? (
            <div className="text-center py-10 text-slate-500 font-semibold">Cargando usuarios...</div>
          ) : (
            <div className="space-y-4">
              {users.map((u) => {
                const userRole = getRoleName(u);
                return (
                  <div key={u.id_usuario} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100/50 hover:bg-slate-50 rounded-xl transition-colors ${userRole === 'Desactivado' ? 'opacity-60 grayscale' : ''}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className={`h-10 w-10 ${userRole === 'Desactivado' ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-700'} rounded-full flex items-center justify-center font-bold shrink-0`}>
                        {(u.nombre || u.correo || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{u.nombre || 'Sin nombre'}</div>
                        <div className="text-sm text-slate-500">{u.correo}</div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center gap-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        userRole === 'Publicador' ? 'bg-indigo-100 text-indigo-700' :
                        userRole === 'Administrador' ? 'bg-rose-100 text-rose-700' :
                        userRole === 'Desactivado' ? 'bg-slate-200 text-slate-600' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {userRole.toUpperCase()}
                      </span>
                      {u.id_usuario !== user.id_usuario && u.correo !== 'admin@gmail.com' && u.correo !== 'admin1@gmail.com' && (
                        <Button
                          onClick={() => handleRoleChange(u.id_usuario, userRole)}
                          variant={userRole === 'Desactivado' ? 'outline' : 'default'}
                          className={userRole === 'Desactivado' ? '' : 'bg-rose-600 hover:bg-rose-700 text-white'}
                          size="sm"
                          disabled={actionLoading}
                        >
                          {userRole === 'Desactivado' ? 'Activar' : 'Desactivar'}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {deactivateConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex justify-center mb-4 text-rose-500">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 text-center">¿Desactivar usuario?</h3>
            <p className="text-slate-600 text-sm mb-6 text-center">
              El usuario perderá el acceso a funcionalidades y sus favoritos serán eliminados.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold"
                onClick={confirmDeactivate}
                disabled={actionLoading}
              >
                {actionLoading ? 'Procesando...' : 'Sí, desactivar usuario'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setDeactivateConfirm(null)}
                disabled={actionLoading}
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
