import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { FolderLock, Star, AlertTriangle, Clock, Plus, Wand2 } from 'lucide-react';
import { getPasswordStrength } from '../utils/passwordUtils';

function Dashboard() {
  const { user } = useAuth();
  const { items, loading } = useVault();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate stats
  const totalItems = items.length;
  const favorites = items.filter((i) => i.favorite).length;
  const weakPasswords = items.filter(
    (i) => getPasswordStrength(i.password).level <= 2
  ).length;
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentlyAdded = items.filter(
    (i) => new Date(i.createdAt) > oneWeekAgo
  ).length;

  if (loading) {
    return <div className="page-loading">Loading your vault...</div>;
  }

  return (
    <div className="dashboard-home">
      <div className="greeting-section">
        <h1>
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p>Your digital vault is organized and secure.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FolderLock size={20} />
          </div>
          <div className="stat-info">
            <h3>{totalItems}</h3>
            <p>Total Items</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Star size={20} />
          </div>
          <div className="stat-info">
            <h3>{favorites}</h3>
            <p>Favorites</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-info">
            <h3>{weakPasswords}</h3>
            <p>Weak Passwords</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <h3>{recentlyAdded}</h3>
            <p>Recently Added</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <Link to="/dashboard/vault" className="btn btn-primary">
            <Plus size={18} />
            Add Password
          </Link>
          <Link to="/dashboard/generator" className="btn btn-secondary">
            <Wand2 size={18} />
            Generate Password
          </Link>
          <Link to="/dashboard/health" className="btn btn-secondary">
            <AlertTriangle size={18} />
            Check Health
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
