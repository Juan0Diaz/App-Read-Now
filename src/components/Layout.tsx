import React from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Library, User, LogOut, Settings, LayoutDashboard, Search, UploadCloud, Users, Heart, BookOpen, Menu, ShieldAlert, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, buttonVariants } from './ui/Button';

export const Layout = () => {
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const NavLink = ({ to, icon, label, mobileHide = false }: { to: string, icon: React.ReactNode, label: string, mobileHide?: boolean }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
          isActive 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-500 hover:bg-slate-50'
        } ${mobileHide ? 'hidden md:flex' : ''}`}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
      </Link>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0 z-30 h-[73px]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <Library className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-indigo-950">READNOW</span>
        </div>
        {user ? (
          <Link to="/perfil" className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
            {user.correo?.charAt(0).toUpperCase()}
          </Link>
        ) : (
          <Link to="/login" className="text-sm font-semibold text-indigo-600">Entrar</Link>
        )}
      </header>

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col h-screen shrink-0 sticky top-0 hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
            <Library className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-indigo-950 truncate">READNOW</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          {role !== 'Desactivado' && <NavLink to="/" icon={<LayoutDashboard className="w-5 h-5" />} label="Catálogo" />}
          
          {user && (
            <>
              {role !== 'Desactivado' && <NavLink to="/favoritos" icon={<Heart className="w-5 h-5" />} label="Mis Favoritos" />}
              {role !== 'Desactivado' && <NavLink to="/prestamos" icon={<Clock className="w-5 h-5" />} label="Mis Préstamos" />}
              <NavLink to="/perfil" icon={<User className="w-5 h-5" />} label="Mi Perfil" />
              
              {role === 'Publicador' && (
                <>
                  <div className="pt-8 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Publicador</div>
                  <NavLink to="/publicador/libros" icon={<BookOpen className="w-5 h-5" />} label="Mis Publicaciones" />
                </>
              )}
              
              {role === 'Administrador' && (
                <>
                  <div className="pt-8 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</div>
                  <NavLink to="/publicador/libros" icon={<BookOpen className="w-5 h-5" />} label="Gestión de Catálogo" />
                  <NavLink to="/admin" icon={<Users className="w-5 h-5" />} label="Gestión de Usuarios" />
                </>
              )}
            </>
          )}
        </nav>

        {user ? (
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-200 border-2 border-white overflow-hidden shrink-0 flex items-center justify-center text-indigo-700 font-bold">
                {user.correo?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.correo}</p>
                <p className="text-xs text-slate-500 truncate">{role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-slate-100 space-y-2">
            <Link to="/login" className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Iniciar Sesión
            </Link>
            <Link to="/login?register=true" className="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-100 transition-colors">
              Registrarse
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 relative">
        {role === 'Desactivado' && location.pathname !== '/perfil' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-sm border 4 border-white">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Cuenta Desactivada</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Tu cuenta ha sido desactivada por un administrador. No puedes acceder al catálogo ni realizar acciones.
            </p>
            <Link to="/perfil" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 px-6 py-3 rounded-xl font-bold transition-colors">
              Ir a mi perfil
            </Link>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-white border-t border-slate-200 h-16 flex items-center justify-around shrink-0 z-20 px-2 pb-safe">
        {role !== 'Desactivado' && (
          <Link to="/" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-indigo-600' : 'text-slate-500'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Inicio</span>
          </Link>
        )}
        
        {role === 'Publicador' && (
          <Link to="/publicador/libros" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname.startsWith('/publicador') ? 'text-indigo-600' : 'text-slate-500'}`}>
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold">Mis Libros</span>
          </Link>
        )}
        
        {role === 'Administrador' && (
          <>
            <Link to="/publicador/libros" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname.startsWith('/publicador') ? 'text-indigo-600' : 'text-slate-500'}`}>
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] font-bold">Catálogo</span>
            </Link>
            <Link to="/admin" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname.startsWith('/admin') ? 'text-indigo-600' : 'text-slate-500'}`}>
              <Users className="w-5 h-5" />
              <span className="text-[10px] font-bold">Usuarios</span>
            </Link>
          </>
        )}

        {user && role !== 'Desactivado' && (
          <Link to="/favoritos" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname === '/favoritos' ? 'text-indigo-600' : 'text-slate-500'}`}>
            <Heart className="w-5 h-5" />
            <span className="text-[10px] font-bold">Favoritos</span>
          </Link>
        )}

        {user && role !== 'Desactivado' && (
          <Link to="/prestamos" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname === '/prestamos' ? 'text-indigo-600' : 'text-slate-500'}`}>
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-bold">Préstamos</span>
          </Link>
        )}

        {user ? (
          <Link to="/perfil" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname === '/perfil' ? 'text-indigo-600' : 'text-slate-500'}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">Perfil</span>
          </Link>
        ) : (
          <Link to="/login" className="p-3 rounded-full flex flex-col items-center gap-1 text-slate-500">
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">Entrar</span>
          </Link>
        )}
      </nav>
    </div>
  );
};
