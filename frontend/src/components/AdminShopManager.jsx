import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5000/api"; // Change if backend URL differs

export default function AdminShopManager({ username, secretCode }) {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editItemId, setEditItemId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/shop/items`);
      setItems(res.data);
    } catch (err) {
      alert("Failed to fetch shop items");
    }
  };

  const authData = { username, secretCode };

  const handleAdd = async () => {
    if (!newName || !newPrice || isNaN(parseFloat(newPrice))) {
      alert("Enter valid name and price");
      return;
    }
    try {
      const res = await axios.post(
        `${API}/admin/shop/add`,
        { ...authData, name: newName, price: parseFloat(newPrice) }
      );
      alert(res.data.message);
      setNewName("");
      setNewPrice("");
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || "Add item failed");
    }
  };

  const startEdit = (item) => {
    setEditItemId(item.id);
    setEditName(item.name);
    setEditPrice(item.price);
  };

  const cancelEdit = () => {
    setEditItemId(null);
    setEditName("");
    setEditPrice("");
  };

  const saveEdit = async () => {
    if (!editName || !editPrice || isNaN(parseFloat(editPrice))) {
      alert("Enter valid name and price");
      return;
    }
    try {
      const res = await axios.post(
        `${API}/admin/shop/edit`,
        { ...authData, id: editItemId, name: editName, price: parseFloat(editPrice) }
      );
      alert(res.data.message);
      setEditItemId(null);
      setEditName("");
      setEditPrice("");
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || "Edit item failed");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await axios.post(
        `${API}/admin/shop/delete`,
        { ...authData, id }
      );
      alert(res.data.message);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || "Delete item failed");
    }
  };

  return (
    <div style={{ border: "1px solid #aaa", padding: "1rem", marginTop: "1rem" }}>
      <h2>Admin Shop Manager</h2>

      <h3>Add New Item</h3>
      <input
        type="text"
        placeholder="Item name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={newPrice}
        onChange={(e) => setNewPrice(e.target.value)}
      />
      <button onClick={handleAdd}>Add Item</button>

      <h3>Existing Items</h3>
      {items.length === 0 && <p>No items in the shop.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: "0.5rem" }}>
            {editItemId === item.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
                <button onClick={saveEdit}>Save</button>
                <button onClick={cancelEdit}>Cancel</button>
              </>
            ) : (
              <>
                <strong>{item.name}</strong> - ${item.price.toFixed(2)}
                <button onClick={() => startEdit(item)} style={{ marginLeft: "1rem" }}>
                  Edit
                </button>
                <button onClick={() => deleteItem(item.id)} style={{ marginLeft: "0.5rem" }}>
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
