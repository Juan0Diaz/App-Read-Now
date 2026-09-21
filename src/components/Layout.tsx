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
    return <div className="min-h-screen flex items-center justify-center bg-surface-soft text-text-muted">Cargando...</div>;
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
            ? 'bg-primary/10 text-primary' 
            : 'text-text-body hover:bg-surface-soft dark:text-text-body dark:hover:bg-surface-muted'
        } ${mobileHide ? 'hidden md:flex' : ''}`}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
      </Link>
    );
  };

  return (
    <div className="bg-surface-soft min-h-screen w-full flex flex-col md:flex-row font-sans text-text-strong overflow-hidden dark:bg-surface-soft dark:text-text-strong">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-surface border-b border-border p-4 flex items-center justify-between shrink-0 z-30 h-[73px] dark:bg-surface dark:border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md">
            <Library className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-text-strong">READNOW</span>
        </div>
        {user ? (
          <Link to="/perfil" className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
            {user.correo?.charAt(0).toUpperCase()}
          </Link>
        ) : (
          <Link to="/login" className="text-sm font-semibold text-primary">Entrar</Link>
        )}
      </header>

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-surface border-r border-border flex-col h-screen shrink-0 sticky top-0 hidden md:flex dark:bg-surface dark:border-border">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <Library className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-text-strong truncate">READNOW</span>
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
                  <div className="pt-8 pb-2 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">PUBLICADOR</div>
                  <NavLink to="/publicador/libros" icon={<BookOpen className="w-5 h-5" />} label="Mis Publicaciones" />
                </>
              )}
              
              {role === 'Administrador' && (
                <>
                  <div className="pt-8 pb-2 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">ADMIN</div>
                  <NavLink to="/publicador/libros" icon={<BookOpen className="w-5 h-5" />} label="Gestión de Catálogo" />
                  <NavLink to="/admin" icon={<Users className="w-5 h-5" />} label="Gestión de Usuarios" />
                </>
              )}
            </>
          )}
        </nav>

        {user ? (
          <div className="p-4 border-t border-border dark:border-border">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-soft mb-2 dark:bg-surface-soft">
              <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-surface overflow-hidden shrink-0 flex items-center justify-center text-primary font-bold">
                {user.correo?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-strong truncate">{user.correo}</p>
                <p className="text-xs text-text-muted truncate">{role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-error bg-error/10 hover:bg-error/20 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-border space-y-2 dark:border-border">
            <Link to="/login" className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-text-body bg-surface-soft hover:bg-surface-muted rounded-lg transition-colors">
              Iniciar Sesión
            </Link>
            <Link to="/login?register=true" className="flex items-center justify-center w-full px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md shadow-primary/20 transition-colors">
              Registrarse
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-surface-soft relative dark:bg-surface-soft">
        {role === 'Desactivado' && location.pathname !== '/perfil' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6 shadow-sm border border-surface">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-text-strong mb-2">Cuenta Desactivada</h2>
            <p className="text-text-muted max-w-md mx-auto mb-8">
              Tu cuenta ha sido desactivada por un administrador. No puedes acceder al catálogo ni realizar acciones.
            </p>
            <Link to="/perfil" className="bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20 px-6 py-3 rounded-xl font-bold transition-colors">
              Ir a mi perfil
            </Link>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-surface border-t border-border h-16 flex items-center justify-around shrink-0 z-20 px-2 pb-safe dark:bg-surface dark:border-border">
        {role !== 'Desactivado' && (
          <Link to="/" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-primary' : 'text-text-muted'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-bold">Inicio</span>
          </Link>
        )}
        
        {role === 'Publicador' && (
          <Link to="/publicador/libros" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname.startsWith('/publicador') ? 'text-primary' : 'text-text-muted'}`}>
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-bold">Mis Libros</span>
          </Link>
        )}
        
        {role === 'Administrador' && (
          <>
            <Link to="/publicador/libros" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname.startsWith('/publicador') ? 'text-primary' : 'text-text-muted'}`}>
              <BookOpen className="w-5 h-5" />
              <span className="text-xs font-bold">Catálogo</span>
            </Link>
            <Link to="/admin" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname.startsWith('/admin') ? 'text-primary' : 'text-text-muted'}`}>
              <Users className="w-5 h-5" />
              <span className="text-xs font-bold">Usuarios</span>
            </Link>
          </>
        )}

        {user && role !== 'Desactivado' && (
          <Link to="/favoritos" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname === '/favoritos' ? 'text-primary' : 'text-text-muted'}`}>
            <Heart className="w-5 h-5" />
            <span className="text-xs font-bold">Favoritos</span>
          </Link>
        )}

        {user && role !== 'Desactivado' && (
          <Link to="/prestamos" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname === '/prestamos' ? 'text-primary' : 'text-text-muted'}`}>
            <Clock className="w-5 h-5" />
            <span className="text-xs font-bold">Préstamos</span>
          </Link>
        )}

        {user ? (
          <Link to="/perfil" className={`p-3 rounded-full flex flex-col items-center gap-1 ${location.pathname === '/perfil' ? 'text-primary' : 'text-text-muted'}`}>
            <User className="w-5 h-5" />
            <span className="text-xs font-bold">Perfil</span>
          </Link>
        ) : (
          <Link to="/login" className="p-3 rounded-full flex flex-col items-center gap-1 text-text-muted">
            <User className="w-5 h-5" />
            <span className="text-xs font-bold">Entrar</span>
          </Link>
        )}
      </nav>
    </div>
  );
};
