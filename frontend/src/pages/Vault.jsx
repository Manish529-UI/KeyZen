import { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { useToast } from '../context/ToastContext';
import VaultItemModal from '../components/VaultItemModal';
import ConfirmModal from '../components/ConfirmModal';
import { getPasswordStrength } from '../utils/passwordUtils';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Star,
  Edit3,
  Trash2,
  ExternalLink,
  FolderLock,
  User,
} from 'lucide-react';

function Vault() {
  const { items, loading, addItem, updateItem, deleteItem, toggleFavorite } =
    useVault();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Filter and search
  const filteredItems = items.filter((item) => {
    if (search) {
      const s = search.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(s) ||
        (item.username && item.username.toLowerCase().includes(s)) ||
        (item.url && item.url.toLowerCase().includes(s));
      if (!matchesSearch) return false;
    }
    if (filter === 'favorites') return item.favorite;
    if (filter === 'weak') return getPasswordStrength(item.password).level <= 2;
    if (filter === 'recent') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(item.createdAt) > oneWeekAgo;
    }
    return true;
  });

  const handleTogglePassword = (id) => {
    setVisiblePasswords((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id]) {
        setTimeout(() => {
          setVisiblePasswords((p) => ({ ...p, [id]: false }));
        }, 5000);
      }
      return next;
    });
  };

  const handleCopy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard`, 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleSave = async (data) => {
    if (editItem) {
      await updateItem(editItem._id, data);
      showToast('Password updated successfully', 'success');
    } else {
      await addItem(data);
      showToast('Password saved successfully', 'success');
    }
    setShowModal(false);
    setEditItem(null);
  };

  const handleDelete = async () => {
    try {
      await deleteItem(deleteTarget._id);
      showToast('Password deleted', 'success');
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleFavorite = async (id) => {
    try {
      await toggleFavorite(id);
    } catch {
      showToast('Failed to update', 'error');
    }
  };

  if (loading) {
    return <div className="page-loading">Loading vault...</div>;
  }

  return (
    <div className="vault-page">
      <div className="page-header">
        <div>
          <h1>Vault</h1>
          <p>Manage your saved passwords</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditItem(null);
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Add Password
        </button>
      </div>

      <div className="vault-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search passwords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['all', 'favorites', 'weak', 'recent'].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <FolderLock size={48} />
          <h3>
            {search || filter !== 'all'
              ? 'No matching passwords'
              : 'No passwords yet'}
          </h3>
          <p>
            {search || filter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Your vault is ready. Add your first login to get started.'}
          </p>
          {!search && filter === 'all' && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditItem(null);
                setShowModal(true);
              }}
            >
              <Plus size={18} />
              Add Your First Password
            </button>
          )}
        </div>
      ) : (
        <div className="vault-list">
          {filteredItems.map((item) => (
            <div key={item._id} className="vault-item">
              <div className="vault-item-icon">
                {item.title.charAt(0).toUpperCase()}
              </div>

              <div className="vault-item-info">
                <div className="vault-item-title">
                  {item.title}
                  {item.url && (
                    <a
                      href={
                        item.url.startsWith('http')
                          ? item.url
                          : `https://${item.url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.url}
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <div className="vault-item-username">
                  {item.username || '—'}
                </div>
              </div>

              <div className="vault-item-password">
                <span className={visiblePasswords[item._id] ? '' : 'password-hidden'}>
                  {visiblePasswords[item._id] ? item.password : '••••••••'}
                </span>
              </div>

              <div className="vault-item-actions">
                <button
                  className="btn-icon"
                  onClick={() => handleTogglePassword(item._id)}
                  title={
                    visiblePasswords[item._id] ? 'Hide password' : 'Show password'
                  }
                >
                  {visiblePasswords[item._id] ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleCopy(item.password, 'Password')}
                  title="Copy password"
                >
                  <Copy size={16} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleCopy(item.username, 'Username')}
                  title="Copy username"
                >
                  <User size={16} />
                </button>
                <button
                  className={`btn-icon ${item.favorite ? 'favorite-active' : ''}`}
                  onClick={() => handleFavorite(item._id)}
                  title={
                    item.favorite
                      ? 'Remove from favorites'
                      : 'Add to favorites'
                  }
                >
                  <Star
                    size={16}
                    fill={item.favorite ? 'currentColor' : 'none'}
                  />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => {
                    setEditItem(item);
                    setShowModal(true);
                  }}
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="btn-icon btn-icon-danger"
                  onClick={() => setDeleteTarget(item)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <VaultItemModal
          item={editItem}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete this password?"
          message="This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default Vault;
