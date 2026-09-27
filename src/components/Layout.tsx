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

  const profileInitial = (user?.nombre || user?.correo || 'U').charAt(0).toUpperCase();

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
    <div className="flex h-screen w-full overflow-hidden bg-surface-soft font-sans text-text-strong dark:bg-surface-soft dark:text-text-strong md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-surface border-b border-border p-4 flex items-center justify-between shrink-0 z-30 h-[73px] dark:bg-surface dark:border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md">
            <Library className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-text-strong">READNOW</span>
        </div>
        {user ? (
          <Link to="/perfil" className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 dark:bg-primary/20 dark:text-white">
            {profileInitial}
          </Link>
        ) : (
          <Link to="/login" className="text-sm font-semibold text-primary">Entrar</Link>
        )}
      </header>

      {/* Sidebar Navigation */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface dark:border-border dark:bg-surface md:flex">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <Library className="h-6 w-6" />
          </div>
          <span className="truncate text-xl font-bold tracking-tight text-text-strong">READNOW</span>
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-4">
          {role !== 'Desactivado' && <NavLink to="/" icon={<LayoutDashboard className="w-5 h-5" />} label="Catálogo" />}

          {user && (
            <>
              {role !== 'Desactivado' && <NavLink to="/favoritos" icon={<Heart className="w-5 h-5" />} label="Mis Favoritos" />}
              {role !== 'Desactivado' && <NavLink to="/prestamos" icon={<Clock className="w-5 h-5" />} label="Mis Préstamos" />}
              <NavLink to="/perfil" icon={<User className="w-5 h-5" />} label="Mi Perfil" />

              {role === 'Publicador' && (
                <>
                  <div className="px-4 pb-2 pt-8 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">PUBLICADOR</div>
                  <NavLink to="/publicador/libros" icon={<BookOpen className="w-5 h-5" />} label="Mis Publicaciones" />
                </>
              )}

              {role === 'Administrador' && (
                <>
                  <div className="px-4 pb-2 pt-8 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">ADMIN</div>
                  <NavLink to="/publicador/libros" icon={<BookOpen className="w-5 h-5" />} label="Gestión de Catálogo" />
                  <NavLink to="/admin" icon={<Users className="w-5 h-5" />} label="Gestión de Usuarios" />
                </>
              )}
            </>
          )}
        </nav>

        {user ? (
          <div className="mt-auto border-t border-border p-4 dark:border-border">
            <div className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-surface-soft p-2 shadow-sm dark:border-border dark:bg-surface-muted dark:shadow-none">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-primary/10 text-sm font-bold text-primary dark:border-border dark:bg-primary/20 dark:text-text-strong">
                {profileInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-strong dark:text-text-strong">{user.correo}</p>
                <p className="truncate text-xs font-medium text-text-muted dark:text-text-body">{role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-error/10 px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/20"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="mt-auto space-y-2 border-t border-border p-4 dark:border-border">
            <Link to="/login" className="flex w-full items-center justify-center rounded-lg bg-surface-soft px-4 py-2 text-sm font-medium text-text-body transition-colors hover:bg-surface-muted">
              Iniciar Sesión
            </Link>
            <Link to="/login?register=true" className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover">
              Registrarse
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-soft dark:bg-surface-soft">
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
