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
    <div className="flex h-full flex-col animate-in fade-in bg-surface-soft text-text-strong duration-500 dark:bg-surface-soft">
      <header className="sticky top-0 z-10 flex h-20 w-full shrink-0 items-center border-b border-border bg-surface px-8 dark:border-border dark:bg-surface">
        <h1 className="text-xl font-bold text-text-strong">Admin Dashboard</h1>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 overflow-y-auto p-8">
        <div className="mb-8 w-full">
          <h2 className="text-2xl font-bold tracking-tight text-text-strong">Gestión de Usuarios</h2>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {loading ? (
            <div className="py-10 text-center text-sm font-semibold text-text-muted">Cargando usuarios...</div>
          ) : (
            <div className="space-y-4">
              {users.map((u) => {
                const userRole = getRoleName(u);
                return (
                  <div key={u.id_usuario} className={`flex flex-col justify-between rounded-xl border border-border p-4 transition-colors hover:bg-surface-soft sm:flex-row sm:items-center ${userRole === 'Desactivado' ? 'opacity-60 grayscale' : ''}`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${userRole === 'Desactivado' ? 'bg-surface-muted text-text-muted' : 'bg-primary/10 text-primary'}`}>
                        {(u.nombre || u.correo || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-text-strong">{u.nombre || 'Sin nombre'}</div>
                        <div className="text-sm text-text-muted">{u.correo}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 sm:mt-0">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        userRole === 'Publicador' ? 'bg-primary/10 text-primary' :
                        userRole === 'Administrador' ? 'bg-error/10 text-error' :
                        userRole === 'Desactivado' ? 'bg-surface-muted text-text-muted' :
                        'bg-success-soft text-success'
                      }`}>
                        {userRole.toUpperCase()}
                      </span>
                      {u.id_usuario !== user.id_usuario && u.correo !== 'admin@gmail.com' && u.correo !== 'admin1@gmail.com' && (
                        <Button
                          onClick={() => handleRoleChange(u.id_usuario, userRole)}
                          variant={userRole === 'Desactivado' ? 'outline' : 'destructive'}
                          className={userRole === 'Desactivado' ? '' : 'text-white'}
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
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex justify-center text-rose-500">
              <AlertTriangle className="h-12 w-12" />
            </div>
            <h3 className="mb-2 text-center text-xl font-bold text-text-strong dark:text-white">¿Desactivar usuario?</h3>
            <p className="mb-6 text-center text-sm text-text-body dark:text-slate-300">
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
