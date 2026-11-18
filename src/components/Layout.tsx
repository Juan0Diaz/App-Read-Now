import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Library, User, UserPlus, LogOut, LayoutDashboard, Users, Heart, BookOpen, ShieldAlert, Clock, ClipboardCheck, Tags, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buttonVariants } from './ui/Button';
import { getSolicitudesRevision } from '../microservicios/Libros';

export const Layout = () => {
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    if (!user || role !== 'Administrador') return;
    getSolicitudesRevision()
      .then((libros) => setPendingReviews(libros.length))
      .catch(() => setPendingReviews(0));
  }, [location.pathname, role, user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface-soft text-text-muted">Cargando...</div>;
  }

  const isPublisherRoute = location.pathname.startsWith('/publicador/libros');
  const isAdminRoute = location.pathname.startsWith('/admin');
  if (!user && (isPublisherRoute || isAdminRoute)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const profileInitial = (user?.nombre || user?.correo || 'U').charAt(0).toUpperCase();
  const guestAccessTitle = {
    '/favoritos': 'Inicia sesión para ver tus favoritos',
    '/prestamos': 'Inicia sesión para ver tus préstamos',
    '/perfil': 'Inicia sesión para ver tu perfil',
  }[location.pathname];
  const isRouteActive = (to: string) => to === '/'
    ? location.pathname === '/' || location.pathname.startsWith('/libro/')
    : location.pathname === to || location.pathname.startsWith(`${to}/`);
  const mobileNavItemClasses = (active: boolean) =>
    `flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 transition-colors ${
      active ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-surface-soft'
    }`;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const NavLink = ({ to, icon, label, mobileHide = false, badge, locked = false }: { to: string, icon: React.ReactNode, label: string, mobileHide?: boolean, badge?: number, locked?: boolean }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
          isActive 
            ? 'bg-primary/10 text-blue-700 dark:text-blue-300'
            : 'text-text-body hover:bg-surface-soft dark:text-text-body dark:hover:bg-surface-muted'
        } ${mobileHide ? 'hidden md:flex' : ''} landscape-phone:gap-2 landscape-phone:px-2 landscape-phone:py-1 landscape-phone:text-sm`}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
        {locked && <Lock aria-hidden="true" className="ml-auto h-3.5 w-3.5" />}
        {badge ? <span className="ml-auto rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-slate-950 landscape-phone:px-1 landscape-phone:text-[9px]">{badge}</span> : null}
      </Link>
    );
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-surface-soft font-sans text-text-strong dark:bg-surface-soft dark:text-text-strong md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-surface border-b border-border p-4 flex items-center justify-between shrink-0 z-30 h-[73px] dark:bg-surface dark:border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-md">
            <Library className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-text-strong">READNOW</span>
        </div>
        {user ? (
          <Link to="/perfil" aria-label="Mi perfil" className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 dark:bg-primary/20 dark:text-white">
            {profileInitial}
          </Link>
        ) : (
          <Link to="/login" className="text-sm font-semibold text-primary">Entrar</Link>
        )}
      </header>

      {/* Sidebar Navigation */}
      <aside className="layout-divider-right sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-surface md:flex landscape-phone:min-h-0 landscape-phone:overflow-y-auto landscape-phone:overscroll-contain">
        <div className="flex shrink-0 items-center gap-3 p-6 landscape-phone:gap-2 landscape-phone:p-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 landscape-phone:h-8 landscape-phone:w-8">
            <Library className="h-6 w-6 landscape-phone:h-5 landscape-phone:w-5" />
          </div>
          <span className="truncate text-xl font-bold tracking-tight text-text-strong landscape-phone:text-base">READNOW</span>
        </div>

        {user && (
          <div className="shrink-0 px-4 pb-2 landscape-phone:px-2 landscape-phone:pb-1">
            <div className="profile-card-glow flex items-center gap-3 rounded-xl border border-border bg-surface-soft p-2 shadow-sm dark:border-border dark:bg-surface-muted dark:shadow-none landscape-phone:gap-2 landscape-phone:p-1">
              <div className="profile-avatar-glow flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-primary/10 text-sm font-bold text-primary dark:border-border dark:bg-primary/20 dark:text-text-strong landscape-phone:h-7 landscape-phone:w-7 landscape-phone:text-xs">
                {profileInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-strong dark:text-text-strong landscape-phone:text-xs">{user.nombre || user.correo}</p>
                <p className="truncate text-xs font-medium text-text-muted dark:text-text-body landscape-phone:text-[10px]">{role}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pt-2 landscape-phone:flex-none landscape-phone:space-y-0.5 landscape-phone:overflow-visible landscape-phone:px-2 landscape-phone:pt-1">
          {role !== 'Desactivado' && <NavLink to="/" icon={<LayoutDashboard className="h-5 w-5 landscape-phone:h-4 landscape-phone:w-4" />} label="Catálogo" />}

          {!user && (
            <>
              <NavLink to="/favoritos" icon={<Heart className="w-5 h-5" />} label="Mis Favoritos" locked />
              <NavLink to="/prestamos" icon={<Clock className="w-5 h-5" />} label="Mis Préstamos" locked />
            </>
          )}

          {user && (
            <>
              {role !== 'Desactivado' && role !== 'Administrador' && <NavLink to="/favoritos" icon={<Heart className="h-5 w-5 landscape-phone:h-4 landscape-phone:w-4" />} label="Mis Favoritos" />}
              {role !== 'Desactivado' && role !== 'Administrador' && <NavLink to="/prestamos" icon={<Clock className="h-5 w-5 landscape-phone:h-4 landscape-phone:w-4" />} label="Mis Préstamos" />}
              <NavLink to="/perfil" icon={<User className="h-5 w-5 landscape-phone:h-4 landscape-phone:w-4" />} label="Mi Perfil" />

              {role === 'Publicador' && (
                <>
                  <div className="px-4 pb-2 pt-8 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted landscape-phone:px-2 landscape-phone:pb-1 landscape-phone:pt-2 landscape-phone:text-[10px] landscape-phone:tracking-wider">PUBLICADOR</div>
                  <NavLink to="/publicador/libros" icon={<BookOpen className="h-5 w-5 landscape-phone:h-4 landscape-phone:w-4" />} label="Mis Publicaciones" />
                </>
              )}

              {role === 'Administrador' && (
                <>
                  <div className="px-4 pb-2 pt-8 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted landscape-phone:px-2 landscape-phone:pb-1 landscape-phone:pt-2 landscape-phone:text-[10px] landscape-phone:tracking-wider">ADMIN</div>
                  <NavLink to="/publicador/libros" icon={<BookOpen className="h-5 w-5 landscape-phone:h-4 landscape-phone:w-4" />} label="Gestión de Catálogo" />
                  <NavLink to="/admin/generos" icon={<Tags className="h-5 w-5 landscape-phone:h-4 landscape-phone:w-4" />} label="Gestión de Géneros" />
                  <NavLink to="/admin/revision-libros" icon={<ClipboardCheck className="h-5 w-5 landscape-phone:h-4 landscape-phone:w-4" />} label="Revisión de libros" badge={pendingReviews} />
                  <NavLink to="/admin" icon={<Users className="h-5 w-5 landscape-phone:h-4 landscape-phone:w-4" />} label="Gestión de Usuarios" />
                </>
              )}
            </>
          )}
        </nav>

        {user ? (
          <div className="mt-auto shrink-0 border-t border-border p-4 landscape-phone:p-2">
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-700 bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-red-900/20 transition-colors hover:border-red-800 hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 dark:border-red-600 dark:bg-red-700 dark:hover:border-red-500 dark:hover:bg-red-600 landscape-phone:gap-1 landscape-phone:px-2 landscape-phone:py-1 landscape-phone:text-xs"
            >
              <LogOut className="h-4 w-4 landscape-phone:h-3 landscape-phone:w-3" />
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="mt-auto shrink-0 space-y-2 border-t border-border p-4">
            <Link to="/login" className={`${buttonVariants({ variant: 'primary' })} w-full`}>
              Iniciar sesión
            </Link>
            <Link to="/login?register=true" className={`${buttonVariants({ variant: 'outline' })} w-full`}>
              Crear cuenta
            </Link>
          </div>
        )}

      </aside>

      {/* Main Content Area */}
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-surface-soft dark:bg-surface-soft">
        <div className="flex min-h-full flex-col">
          <div className="flex-1">
            {role === 'Desactivado' && location.pathname !== '/perfil' ? (
              <div className="flex min-h-full flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
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
            ) : !user && guestAccessTitle ? (
              <div className="flex min-h-full flex-col items-center justify-center p-6 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Lock aria-hidden="true" className="h-8 w-8" />
                </div>
                <h1 className="text-2xl font-bold text-text-strong">{guestAccessTitle}</h1>
                <p className="mt-2 max-w-md text-sm text-text-muted">
                  Inicia sesión o crea una cuenta para acceder a tu información personal.
                </p>
                <div className="mt-6 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
                  <Link to="/login" state={{ from: location }} className={`${buttonVariants({ variant: 'primary' })} w-full`}>
                    Iniciar sesión
                  </Link>
                  <Link to="/login?register=true" state={{ from: location }} className={`${buttonVariants({ variant: 'outline' })} w-full`}>
                    Crear cuenta
                  </Link>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>

          <footer className="layout-divider-top mt-auto bg-surface px-6 py-4 md:px-8" aria-label="Información de READNOW">
            <div className="mx-auto grid w-full gap-4 text-sm text-text-muted sm:grid-cols-2 lg:grid-cols-[1.6fr_1.2fr_1.2fr]">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-md shadow-primary/20">
                    <Library className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <p className="font-bold tracking-tight text-text-strong">READNOW</p>
                </div>
                <p className="max-w-xs text-xs leading-5 text-text-muted">Tu biblioteca digital para descubrir, guardar y compartir libros.</p>
                <p className="mt-3 text-xs text-text-muted">© {new Date().getFullYear()} READNOW · Lecturas para cada momento.</p>
              </div>

              <nav className="flex flex-col gap-1.5" aria-label="Explorar READNOW">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-text-strong">Explorar</p>
                {role !== 'Desactivado' && (
                  <Link to="/" className="flex w-fit items-center gap-2 text-text-body transition-colors hover:text-primary">
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Catálogo de libros
                  </Link>
                )}
                {role !== 'Desactivado' && role !== 'Administrador' && (
                  <Link to="/favoritos" className="flex w-fit items-center gap-2 text-text-body transition-colors hover:text-primary">
                    <Heart className="h-4 w-4" aria-hidden="true" />
                    Mis favoritos
                  </Link>
                )}
                {role !== 'Desactivado' && role !== 'Administrador' && (
                  <Link to="/prestamos" className="flex w-fit items-center gap-2 text-text-body transition-colors hover:text-primary">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    Mis préstamos
                  </Link>
                )}
              </nav>

              <nav className="flex flex-col gap-1.5" aria-label="Cuenta de READNOW">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-text-strong">Tu cuenta</p>
                <Link to="/perfil" className="flex w-fit items-center gap-2 text-text-body transition-colors hover:text-primary">
                  <User className="h-4 w-4" aria-hidden="true" />
                  Mi perfil
                </Link>
                {role === 'Publicador' && (
                  <Link to="/publicador/libros" className="flex w-fit items-center gap-2 text-text-body transition-colors hover:text-primary">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    Mis publicaciones
                  </Link>
                )}
                {role === 'Administrador' && (
                  <Link to="/admin" className="flex w-fit items-center gap-2 text-text-body transition-colors hover:text-primary">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    Gestión de usuarios
                  </Link>
                )}
                {role === 'Administrador' && (
                  <Link to="/admin/generos" className="flex w-fit items-center gap-2 text-text-body transition-colors hover:text-primary">
                    <Tags className="h-4 w-4" aria-hidden="true" />
                    Gestión de géneros
                  </Link>
                )}
                {user && <span className="mt-1 inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Sesión: {role}</span>}
              </nav>
            </div>
          </footer>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav aria-label="Navegación principal" className="md:hidden bg-surface border-t border-border h-16 flex items-center justify-around shrink-0 z-20 gap-1 px-2 pb-safe dark:bg-surface dark:border-border">
        {role !== 'Desactivado' && (
          <Link to="/" aria-current={isRouteActive('/') ? 'page' : undefined} className={mobileNavItemClasses(isRouteActive('/'))}>
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate text-[10px] font-bold sm:text-xs">Inicio</span>
          </Link>
        )}
        
        {role === 'Publicador' && (
          <Link to="/publicador/libros" aria-current={isRouteActive('/publicador/libros') ? 'page' : undefined} className={mobileNavItemClasses(isRouteActive('/publicador/libros'))}>
            <BookOpen className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate text-[10px] font-bold sm:text-xs">Mis Libros</span>
          </Link>
        )}
        
        {role === 'Administrador' && (
          <>
            <Link to="/publicador/libros" aria-current={isRouteActive('/publicador/libros') ? 'page' : undefined} className={mobileNavItemClasses(isRouteActive('/publicador/libros'))}>
              <BookOpen className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate text-[10px] font-bold sm:text-xs">Catálogo</span>
            </Link>
            <Link to="/admin" aria-current={isRouteActive('/admin') ? 'page' : undefined} className={mobileNavItemClasses(isRouteActive('/admin'))}>
              <Users className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate text-[10px] font-bold sm:text-xs">Usuarios</span>
            </Link>
          </>
        )}

        {(!user || role !== 'Desactivado') && role !== 'Administrador' && (
          <Link to="/favoritos" aria-current={isRouteActive('/favoritos') ? 'page' : undefined} className={mobileNavItemClasses(isRouteActive('/favoritos'))}>
            <Heart className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate text-[10px] font-bold sm:text-xs">Favoritos</span>
          </Link>
        )}

        {(!user || role !== 'Desactivado') && role !== 'Administrador' && (
          <Link to="/prestamos" aria-current={isRouteActive('/prestamos') ? 'page' : undefined} className={mobileNavItemClasses(isRouteActive('/prestamos'))}>
            <Clock className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate text-[10px] font-bold sm:text-xs">Préstamos</span>
          </Link>
        )}

        {user ? (
          <Link to="/perfil" aria-current={isRouteActive('/perfil') ? 'page' : undefined} className={mobileNavItemClasses(isRouteActive('/perfil'))}>
            <User className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate text-[10px] font-bold sm:text-xs">Perfil</span>
          </Link>
        ) : (
          <>
            <Link to="/login" aria-current={location.pathname === '/login' ? 'page' : undefined} className={mobileNavItemClasses(location.pathname === '/login')}>
              <User className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate text-[10px] font-bold sm:text-xs">Entrar</span>
            </Link>
            <Link to="/login?register=true" className={mobileNavItemClasses(false)}>
              <UserPlus className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate text-[10px] font-bold sm:text-xs">Registrarse</span>
            </Link>
          </>
        )}
      </nav>
    </div>
  );
};
