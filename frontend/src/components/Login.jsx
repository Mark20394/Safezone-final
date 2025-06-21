import React, { useState } from "react";

export default function Login({ onLogin }) {
  const users = ["Mark", "Jojo", "Toto"];
  const [selectedUser, setSelectedUser] = useState(null);
  const [code, setCode] = useState("");

  const handleUserClick = (username) => {
    setSelectedUser(username);
    setCode("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      alert("Please select a user");
      return;
    }
    if (!code || code.length === 0) {
      alert("Please enter the secret code");
      return;
    }
    onLogin(selectedUser, code);
  };

  return (
    <div>
      <h2>Login</h2>
      <div className="user-buttons">
        {users.map((u) => (
          <button
            key={u}
            onClick={() => handleUserClick(u)}
            className={selectedUser === u ? "active" : ""}
          >
            {u}
          </button>
        ))}
      </div>
      {selectedUser && (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter secret code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
          <button type="submit">Login</button>
        </form>
      )}
    </div>
  );
}
