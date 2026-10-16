import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const VaultContext = createContext();

export function VaultProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchItems = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/vault');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch vault items:', err);
      setError(err.response?.data?.message || 'Failed to load vault items. Please check server connection.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (data) => {
    const res = await api.post('/vault', data);
    setItems((prev) => [res.data, ...prev]);
    return res.data;
  };

  const updateItem = async (id, data) => {
    const res = await api.put(`/vault/${id}`, data);
    setItems((prev) => prev.map((item) => (item._id === id ? res.data : item)));
    return res.data;
  };

  const deleteItem = async (id) => {
    await api.delete(`/vault/${id}`);
    setItems((prev) => prev.filter((item) => item._id !== id));
  };

  const toggleFavorite = async (id) => {
    const res = await api.patch(`/vault/${id}/favorite`);
    setItems((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, favorite: res.data.favorite } : item
      )
    );
  };

  return (
    <VaultContext.Provider
      value={{
        items,
        loading,
        error,
        fetchItems,
        addItem,
        updateItem,
        deleteItem,
        toggleFavorite,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export const useVault = () => useContext(VaultContext);
