import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5000/api"; // Update if needed

export default function TaxSeasons({ user, code }) {
  const [taxSeasons, setTaxSeasons] = useState([]);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newRate, setNewRate] = useState(10);
  const [newDuration, setNewDuration] = useState("weekly");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTaxSeasons();
  }, []);

  const fetchTaxSeasons = async () => {
    try {
      const res = await axios.post(`${API}/tax/seasons`, {
        username: user.username,
        secretCode: code,
      });
      setTaxSeasons(res.data);
    } catch {
      setMessage("Failed to fetch tax seasons");
    }
  };

  const addTaxSeason = async () => {
    if (!newSeasonName || newRate < 0 || newRate > 100) {
      alert("Enter valid name and tax rate between 0 and 100");
      return;
    }
    try {
      const res = await axios.post(`${API}/tax/season/add`, {
        username: user.username,
        secretCode: code,
        name: newSeasonName,
        rate: newRate,
        duration: newDuration,
      });
      setMessage(res.data.message);
      setNewSeasonName("");
      setNewRate(10);
      setNewDuration("weekly");
      fetchTaxSeasons();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to add tax season");
    }
  };

  const removeTaxSeason = async (id) => {
    if (!window.confirm("Are you sure you want to remove this tax season?")) return;
    try {
      const res = await axios.post(`${API}/tax/season/remove`, {
        username: user.username,
        secretCode: code,
        id,
      });
      setMessage(res.data.message);
      fetchTaxSeasons();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to remove tax season");
    }
  };

  return (
    <div style={{ borderTop: "1px solid #ddd", padding: "1rem" }}>
      <h2>Tax Seasons Management</h2>
      {message && <p>{message}</p>}

      <h3>Add New Tax Season</h3>
      <input
        type="text"
        placeholder="Season Name"
        value={newSeasonName}
        onChange={(e) => setNewSeasonName(e.target.value)}
        style={{ marginRight: "0.5rem" }}
      />
      <input
        type="number"
        min="0"
        max="100"
        value={newRate}
        onChange={(e) => setNewRate(Number(e.target.value))}
        style={{ marginRight: "0.5rem", width: "5rem" }}
      />
      <select
        value={newDuration}
        onChange={(e) => setNewDuration(e.target.value)}
        style={{ marginRight: "0.5rem" }}
      >
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
        <option value="custom">Custom</option>
      </select>
      <button onClick={addTaxSeason}>Add Tax Season</button>

      <h3>Active Tax Seasons</h3>
      {taxSeasons.length === 0 ? (
        <p>No active tax seasons.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {taxSeasons.map((season) => (
            <li key={season.id} style={{ marginBottom: "0.5rem" }}>
              <strong>{season.name}</strong> - {season.rate}% - {season.duration}
              <button
                onClick={() => removeTaxSeason(season.id)}
                style={{ marginLeft: "1rem" }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
