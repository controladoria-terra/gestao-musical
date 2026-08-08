import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Music, Menu, X, ChevronRight } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Fornecedores from './pages/Fornecedores';
import Eventos from './pages/Eventos';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Fornecedores', path: '/fornecedores', icon: Users },
    { name: 'Eventos', path: '/eventos', icon: Calendar },
  ];

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard General';
      case '/fornecedores':
        return 'Gestão de Fornecedores';
      case '/eventos':
        return 'Gestão de Eventos';
      default:
        return 'Gestão Musical';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-emerald-950 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-700/60 rounded-lg">
            <Music className="h-6 w-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">Gestão Musical</h1>
            <p className="text-xs text-emerald-300/80">Terra Parque Resort</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-emerald-900 text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Backdrop for Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-emerald-900 text-white flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out shadow-xl md:shadow-none
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Header / Brand */}
          <div className="p-6 border-b border-emerald-800/80 hidden md:flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800/90 rounded-xl shadow-inner border border-emerald-700/50">
              <Music className="h-7 w-7 text-emerald-300" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide text-white">Gestão Musical</h1>
              <span className="text-xs text-emerald-300/90 font-medium tracking-wider uppercase bg-emerald-950/60 px-2 py-0.5 rounded-full inline-block mt-0.5">
                Terra Parque
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 mt-2">
            <p className="px-3 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
              Menu Principal
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150
                    ${isActive 
                      ? 'bg-emerald-800 text-white shadow-sm border-l-4 border-emerald-400 pl-3' 
                      : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-emerald-300" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-emerald-800/80 bg-emerald-950/40 text-xs text-emerald-300/70">
          <p className="font-medium text-emerald-200">Sistema de Eventos</p>
          <p className="mt-0.5">Versão 1.0.0 • React + Vite</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{getPageTitle()}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Painel de gerenciamento de atrações musicais e fornecedores
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistema Ativo
            </span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
