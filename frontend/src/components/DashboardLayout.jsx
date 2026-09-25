import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VaultProvider } from '../context/VaultContext';
import {
  LayoutDashboard,
  FolderLock,
  Star,
  Shield,
  Wand2,
  Settings,
  LogOut,
  Menu,
  X,
  KeyRound,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/vault', icon: FolderLock, label: 'Vault' },
  { to: '/dashboard/favorites', icon: Star, label: 'Favorites' },
  { to: '/dashboard/health', icon: Shield, label: 'Password Health' },
  { to: '/dashboard/generator', icon: Wand2, label: 'Generator' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <VaultProvider>
      <div className="dashboard-layout">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="logo">
              <KeyRound size={20} />
              <span>KeyZen</span>
            </div>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-link logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="dashboard-main">
          <header className="dashboard-header">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="header-user">
              <span className="header-greeting">Welcome, {user?.name}</span>
            </div>
          </header>

          <div className="dashboard-content">
            <Outlet />
          </div>
        </main>
      </div>
    </VaultProvider>
  );
}

export default DashboardLayout;
