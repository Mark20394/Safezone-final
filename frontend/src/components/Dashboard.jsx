import React from "react";

export default function Dashboard({ user, balance, transactions, onLogout }) {
  return (
    <div>
      <h2>Welcome, {user.username} ({user.role})</h2>
      <button onClick={onLogout}>Logout</button>

      <h3>Your Balance</h3>
      <ul>
        {Object.entries(balance).map(([account, amount]) => (
          <li key={account}>
            {account}: ${amount.toFixed(2)}
          </li>
        ))}
      </ul>

      <h3>Recent Transactions</h3>
      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(-10).reverse().map((tx) => (
              <tr key={tx.id}>
                <td>{new Date(tx.timestamp).toLocaleString()}</td>
                <td>{tx.user}</td>
                <td style={{ color: tx.amount < 0 ? "red" : "green" }}>
                  ${Math.abs(tx.amount).toFixed(2)}
                </td>
                <td>{tx.type}</td>
                <td>{tx.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
