/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { useDarkMode } from './hooks/useDarkMode';

const Home = React.lazy(() => import('./pages/Home').then(({ Home }) => ({ default: Home })));
const Login = React.lazy(() => import('./pages/Login').then(({ Login }) => ({ default: Login })));
const BookDetail = React.lazy(() => import('./pages/BookDetail').then(({ BookDetail }) => ({ default: BookDetail })));
const PublisherDashboard = React.lazy(() => import('./pages/PublisherDashboard').then(({ PublisherDashboard }) => ({ default: PublisherDashboard })));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard').then(({ AdminDashboard }) => ({ default: AdminDashboard })));
const Profile = React.lazy(() => import('./pages/Profile').then(({ Profile }) => ({ default: Profile })));
const NewBook = React.lazy(() => import('./pages/NewBook').then(({ NewBook }) => ({ default: NewBook })));
const EditBook = React.lazy(() => import('./pages/EditBook').then(({ EditBook }) => ({ default: EditBook })));
const Favorites = React.lazy(() => import('./pages/Favorites').then(({ Favorites }) => ({ default: Favorites })));
const Loans = React.lazy(() => import('./pages/Loans').then(({ Loans }) => ({ default: Loans })));
const PublicProfile = React.lazy(() => import('./pages/PublicProfile').then(({ PublicProfile }) => ({ default: PublicProfile })));
const UpdatePassword = React.lazy(() => import('./pages/UpdatePassword').then(({ UpdatePassword }) => ({ default: UpdatePassword })));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback').then(({ AuthCallback }) => ({ default: AuthCallback })));

const PageLoading = ({ pageName }: { pageName: string }) => (
  <div className="flex min-h-[40vh] items-center justify-center gap-2 text-text-muted" role="status" aria-live="polite">
    <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
    <span>Cargando {pageName}...</span>
  </div>
);

const withPageLoading = (page: React.ReactNode, pageName: string) => (
  <React.Suspense fallback={<PageLoading pageName={pageName} />}>{page}</React.Suspense>
);

export default function App() {
  useDarkMode(); // Initialize dark mode
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={withPageLoading(<Login />, 'inicio de sesión')} />
          <Route path="/reset-password" element={withPageLoading(<UpdatePassword />, 'restablecimiento de contraseña')} />
          <Route path="/auth/callback" element={withPageLoading(<AuthCallback />, 'autenticación')} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={withPageLoading(<Home />, 'el catálogo')} />
            <Route path="perfil" element={withPageLoading(<Profile />, 'tu perfil')} />
            <Route path="favoritos" element={withPageLoading(<Favorites />, 'tus favoritos')} />
            <Route path="prestamos" element={withPageLoading(<Loans />, 'tus préstamos')} />
            <Route path="libro/:id" element={withPageLoading(<BookDetail />, 'el libro')} />
            <Route path="publicador/libros" element={withPageLoading(<PublisherDashboard />, 'tus publicaciones')} />
            <Route path="publicador/libros/nuevo" element={withPageLoading(<NewBook />, 'el formulario de nuevo libro')} />
            <Route path="publicador/libros/editar/:id" element={withPageLoading(<EditBook />, 'el formulario de edición del libro')} />
            <Route path="publicador/perfil/:id" element={withPageLoading(<PublicProfile />, 'el perfil público')} />
            <Route path="admin" element={withPageLoading(<AdminDashboard />, 'la gestión de usuarios')} />
            {/* Catch-all */}
            <Route path="*" element={<div className="text-center py-20">404 No Encontrado</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
