import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export const AdminDashboard = () => {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Usuario')
        .select('*, Usuario-Rol(id_Rol, Rol(nombre_Rol))');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  };

  const handeRoleChange = async (userId: string, currentRole: string) => {
    if (currentRole === 'Desactivado') {
      try {
        setActionLoading(true);
        
        const { data: visRole, error: roleErr } = await supabase.from('Rol').select('*').eq('nombre_Rol', 'Visualizador').single();
        if (roleErr) throw roleErr;
        if (visRole) {
          const { error } = await supabase.from('Usuario-Rol').update({ id_Rol: visRole.id_Rol }).eq('id_usuario', userId);
          if (error) throw error;
        }
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
    const userId = deactivateConfirm;
    try {
      setActionLoading(true);
      // Remover favoritos de otros usuarios
      const { error: favErr } = await supabase.from('Favoritos').delete().eq('id_usuario', userId);
      if (favErr) throw favErr;
      
      // Activar un usuario bloqueado
      const { data: desRole, error: desErr } = await supabase.from('Rol').select('*').eq('nombre_Rol', 'Desactivado').single();
      if (desErr) throw desErr;
      
      if (desRole) {
        
        const { data: exitingRole } = await supabase.from('Usuario-Rol').select('*').eq('id_usuario', userId).maybeSingle();
        if (exitingRole) {
          const { error } = await supabase.from('Usuario-Rol').update({ id_Rol: desRole.id_Rol }).eq('id_usuario', userId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('Usuario-Rol').insert({ id_usuario: userId, id_Rol: desRole.id_Rol });
          if (error) throw error;
        }
      }
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
              {users.map((u, i) => {
                const userRole = u['Usuario-Rol']?.[0]?.Rol?.nombre_Rol || 'Sin Rol';
                return (
                  <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100/50 hover:bg-slate-50 rounded-xl transition-colors ${userRole === 'Desactivado' ? 'opacity-60 grayscale' : ''}`}>
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
                          onClick={() => handeRoleChange(u.id_usuario, userRole)} 
                          variant={userRole === 'Desactivado' ? 'outline' : 'default'}
                          className={userRole === 'Desactivado' ? '' : 'bg-rose-600 hover:bg-rose-700 text-white'}
                          size="sm" 
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