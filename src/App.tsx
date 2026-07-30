/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { BookDetail } from './pages/BookDetail';
import { PublisherDashboard } from './pages/PublisherDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Profile } from './pages/Profile';
import { NewBook } from './pages/NewBook';
import { EditBook } from './pages/EditBook';
import { Favorites } from './pages/Favorites';
import { Loans } from './pages/Loans';
import { PublicProfile } from './pages/PublicProfile';
import { UpdatePassword } from './pages/UpdatePassword';
import { AuthCallback } from './pages/AuthCallback';
import { useDarkMode } from './hooks/useDarkMode';

export default function App() {
  useDarkMode(); // Initialize dark mode
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<UpdatePassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="perfil" element={<Profile />} />
            <Route path="favoritos" element={<Favorites />} />
            <Route path="prestamos" element={<Loans />} />
            <Route path="libro/:id" element={<BookDetail />} />
            <Route path="publicador/libros" element={<PublisherDashboard />} />
            <Route path="publicador/libros/nuevo" element={<NewBook />} />
            <Route path="publicador/libros/editar/:id" element={<EditBook />} />
            <Route path="publicador/perfil/:id" element={<PublicProfile />} />
            <Route path="admin" element={<AdminDashboard />} />
            {/* Catch-all */}
            <Route path="*" element={<div className="text-center py-20">404 No Encontrado</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
