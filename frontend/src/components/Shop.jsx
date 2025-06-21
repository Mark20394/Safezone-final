import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api'; // Change if backend URL differs

export default function Shop({ user, code }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/shop/items`);
      setItems(res.data);
    } catch {
      setMessage('Failed to load shop items.');
    }
  };

  const placeOrder = async (itemId) => {
    try {
      const res = await axios.post(`${API}/shop/order`, {
        username: user.username,
        secretCode: code,
        itemId,
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to place order.');
    }
  };

  return (
    <div style={{ padding: '1rem', borderTop: '1px solid #ddd' }}>
      <h2>Shop</h2>
      {message && <p>{message}</p>}
      {items.length === 0 ? (
        <p>No items available.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li key={item.id} style={{ marginBottom: '0.5rem' }}>
              <strong>{item.name}</strong> - ${item.price.toFixed(2)}
              <button
                style={{ marginLeft: '1rem' }}
                onClick={() => placeOrder(item.id)}
              >
                Buy
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
