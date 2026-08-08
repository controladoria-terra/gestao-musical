import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Music, Menu, X, ChevronRight, CalendarDays, BarChart3, RefreshCw, Settings, LogOut, Home } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Fornecedores from './pages/Fornecedores';
import Eventos from './pages/Eventos';
import Agenda from './pages/Agenda';
import Relatorios from './pages/Relatorios';
import Sincronizacao from './pages/Sincronizacao';
import Admin from './pages/Admin';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, adminOnly: false },
    { name: 'Agenda', path: '/agenda', icon: CalendarDays, adminOnly: false },
    { name: 'Fornecedores', path: '/fornecedores', icon: Users, adminOnly: false },
    { name: 'Eventos', path: '/eventos', icon: Calendar, adminOnly: false },
    { name: 'Relatórios', path: '/relatorios', icon: BarChart3, adminOnly: false },
    { name: 'Sincronização', path: '/sincronizacao', icon: RefreshCw, adminOnly: false },
    { name: 'Admin', path: '/admin', icon: Settings, adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/agenda': return 'Agenda Musical';
      case '/fornecedores': return 'Gestão de Fornecedores';
      case '/eventos': return 'Gestão de Eventos';
      case '/relatorios': return 'Relatórios e Análises';
      case '/sincronizacao': return 'Sincronização Google';
      case '/admin': return 'Painel Administrativo';
      default: return 'Gestão Musical';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show layout on login page
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
        {/* Mobile Top Header */}
        <div className="md:hidden bg-emerald-950 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-700/60 rounded-lg">
              <Music className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight">Gestão Musical</h1>
              <p className="text-[10px] text-emerald-300/80">{user?.name || 'Usuário'} • {isAdmin ? 'Admin' : 'Visualizador'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="p-2 rounded-lg bg-emerald-900 text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg bg-emerald-900 text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-emerald-900 text-white flex-col justify-between fixed inset-y-0 left-0 z-40 shadow-xl">
          <div>
            <div className="p-6 border-b border-emerald-800/80 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-800/90 rounded-xl shadow-inner border border-emerald-700/50">
                <Music className="h-7 w-7 text-emerald-300" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-wide">Gestão Musical</h1>
                <span className="text-xs text-emerald-300/90 font-medium tracking-wider uppercase bg-emerald-950/60 px-2 py-0.5 rounded-full inline-block mt-0.5">Terra Parque</span>
              </div>
            </div>
            <nav className="p-4 space-y-1.5 mt-2 overflow-y-auto">
              <p className="px-3 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Menu Principal</p>
              {navItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${isActive ? 'bg-emerald-800 text-white shadow-sm border-l-4 border-emerald-400 pl-3' : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'}`}>
                    <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-emerald-300" /><span>{item.name}</span></div>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </NavLink>
                );
              })}
              <p className="px-3 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 mt-3">Ferramentas</p>
              {navItems.slice(4).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${isActive ? 'bg-emerald-800 text-white shadow-sm border-l-4 border-emerald-400 pl-3' : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'}`}>
                    <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-emerald-300" /><span>{item.name}</span></div>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </NavLink>
                );
              })}
            </nav>
          </div>
          <div className="p-4 border-t border-emerald-800/80 bg-emerald-950/40">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-emerald-200">{user?.name}</p>
                <p className="text-xs text-emerald-400">{isAdmin ? 'Administrador' : 'Visualizador'}</p>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-lg bg-emerald-800/60 text-emerald-300 hover:text-white hover:bg-emerald-700 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] text-emerald-300/50">v1.2.0 • Terra Parque Resort</p>
          </div>
        </aside>

        {/* Mobile Slide-in Menu */}
        {mobileMenuOpen && (
          <aside className="md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-emerald-900 text-white flex flex-col shadow-2xl transform transition-transform duration-200">
            <div className="p-4 border-b border-emerald-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-emerald-300" />
                <span className="font-bold text-sm">Menu</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg bg-emerald-800 text-emerald-200">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${isActive ? 'bg-emerald-800 text-white' : 'text-emerald-100 hover:bg-emerald-800/50'}`}>
                    <Icon className="h-5 w-5 text-emerald-300" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-3 border-t border-emerald-800/80">
              <div className="flex items-center justify-between px-2">
                <div>
                  <p className="text-sm font-medium text-emerald-200">{user?.name}</p>
                  <p className="text-xs text-emerald-400">{isAdmin ? 'Administrador' : 'Visualizador'}</p>
                </div>
                <button onClick={handleLogout} className="p-2 rounded-lg bg-emerald-800 text-emerald-300">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 md:ml-64">
          {/* Desktop Header */}
          <header className="hidden md:flex bg-white border-b border-slate-200/80 px-6 py-4 items-center justify-between shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{getPageTitle()}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Painel de gerenciamento de atrações musicais e fornecedores</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>Sistema Ativo
            </span>
          </header>

          {/* Mobile Page Title */}
          <div className="md:hidden px-4 py-2 bg-white border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-800">{getPageTitle()}</h2>
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 bg-slate-50 pb-20 md:pb-8">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/sincronizacao" element={<Sincronizacao />} />
              <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg">
            <div className="flex items-center justify-around px-1 py-1.5">
              {navItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{item.name}</span>
                  </NavLink>
                );
              })}
              {/* More button */}
              <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-slate-400 hover:text-emerald-600">
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">Mais</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </ProtectedRoute>
  );
}
