import { useState } from 'react';
import { useVault } from '../context/VaultContext';
import { useToast } from '../context/ToastContext';
import VaultItemModal from '../components/VaultItemModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  Eye,
  EyeOff,
  Copy,
  Star,
  Edit3,
  Trash2,
  ExternalLink,
  User,
} from 'lucide-react';

function Favorites() {
  const { items, loading, updateItem, deleteItem, toggleFavorite } = useVault();
  const { showToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const favoriteItems = items.filter((i) => i.favorite);

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
    await updateItem(editItem._id, data);
    showToast('Password updated', 'success');
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

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div className="vault-page">
      <div className="page-header">
        <div>
          <h1>Favorites</h1>
          <p>Your most-used passwords</p>
        </div>
      </div>

      {favoriteItems.length === 0 ? (
        <div className="empty-state">
          <Star size={48} />
          <h3>No favorites yet</h3>
          <p>
            Star your frequently used passwords in the Vault to see them here.
          </p>
        </div>
      ) : (
        <div className="vault-list">
          {favoriteItems.map((item) => (
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
                <span
                  className={
                    visiblePasswords[item._id] ? '' : 'password-hidden'
                  }
                >
                  {visiblePasswords[item._id] ? item.password : '••••••••'}
                </span>
              </div>
              <div className="vault-item-actions">
                <button
                  className="btn-icon"
                  onClick={() => handleTogglePassword(item._id)}
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
                >
                  <Copy size={16} />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => handleCopy(item.username, 'Username')}
                >
                  <User size={16} />
                </button>
                <button
                  className="btn-icon favorite-active"
                  onClick={() => toggleFavorite(item._id)}
                >
                  <Star size={16} fill="currentColor" />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => {
                    setEditItem(item);
                    setShowModal(true);
                  }}
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="btn-icon btn-icon-danger"
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && editItem && (
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

export default Favorites;
