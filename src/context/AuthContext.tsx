import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isDemoMode } from '../lib/supabase';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signOut: () => Promise<void>;
  simulateLogin: (role: Role) => void;
  fetchUserData: (uid: string, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
  simulateLogin: () => {},
  fetchUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, simulate being logged out initially
      setLoading(false);
      return;
    }

    // Real Supabase Auth Flow
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch custom user data and role from the 'usuario' and 'usuario_rol' tables
        fetchUserData(session.user.id, session.user.email || '');
      } else {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          fetchUserData(session.user.id, session.user.email || '');
        } else if (event === 'PASSWORD_RECOVERY') {
          if (window.location.pathname !== '/reset-password') {
            window.location.href = '/reset-password';
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (uid: string, email: string) => {
    try {
      if (isDemoMode) return;
      
      // Get user record
      let { data: userData, error: userError } = await supabase
        .from('Usuario')
        .select('*')
        .eq('id_usuario', uid)
        .maybeSingle();

      if (userError) {
        console.error("Error al buscar usuario", userError);
      }
        
      if (!userData) {
         // Si el usuario existe en Auth pero fue eliminado de la base de datos pública, recreamos su perfil
         const safeEmail = email || `${uid}@user.local`;
         const safeName = safeEmail.split('@')[0];
         
         const { data: insertedUser, error: insertError } = await supabase.from('Usuario').upsert([
           { 
             id_usuario: uid, 
             correo: safeEmail, 
             contrasena: 'N/A: OAUTH',
             nombre: safeName, 
             fecha_date: new Date().toISOString().split('T')[0] // Default
           }
         ], { onConflict: 'id_usuario' }).select('*').maybeSingle();
         
         if (insertError) {
           console.error("Error re-creando usuario", insertError);
         } else if (insertedUser) {
           userData = insertedUser;
         }
         
         let roleName = 'Visualizador';
         if (email.toLowerCase() === 'admin@gmail.com' || email.toLowerCase() === 'admin1@gmail.com') {
           roleName = 'Administrador';
         }
         
         const { data: roleAssigned } = await supabase.from('Rol').select('*').eq('nombre_Rol', roleName).maybeSingle();
         if (roleAssigned) {
           await supabase.from('Usuario-Rol').upsert({ id_usuario: uid, id_Rol: roleAssigned.id_Rol }, { onConflict: 'id_usuario' });
         }
      }

      if (userData) {
        setUser(userData);
      } else {
        // Fallback if not found in custom table but in auth
        setUser({ id_usuario: uid, correo: email });
      }

      // Get user role
      const { data: roleData } = await supabase
        .from('Usuario-Rol')
        .select('id_Rol, Rol(nombre_Rol)')
        .eq('id_usuario', uid)
        .maybeSingle();
      
      if (roleData && roleData.Rol) {
        // @ts-ignore
        setRole(roleData.Rol.nombre_Rol as Role);
      } else {
        setRole('Visualizador'); // Default
      }
      
    } catch (err) {
      console.error('Error fetching user data', err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null);
      setRole(null);
      return;
    }
    await supabase.auth.signOut();
  };

  const simulateLogin = (selectedRole: Role) => {
    setUser({ id_usuario: 'demo-id', correo: `demo-${selectedRole.toLowerCase()}@biblio.local` });
    setRole(selectedRole);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, simulateLogin, fetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
