import React from "react";

export default function TransactionHistory({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div style={{ marginTop: "1rem" }}>
        <h2>Transaction History</h2>
        <p>No transactions found.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1rem", maxHeight: "300px", overflowY: "auto" }}>
      <h2>Transaction History</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Date</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Type</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>From</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>To</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem", textAlign: "right" }}>Amount ($)</th>
            <th style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem" }}>{new Date(tx.date).toLocaleString()}</td>
              <td style={{ padding: "0.5rem" }}>{tx.type}</td>
              <td style={{ padding: "0.5rem" }}>{tx.from || "-"}</td>
              <td style={{ padding: "0.5rem" }}>{tx.to || "-"}</td>
              <td style={{ padding: "0.5rem", textAlign: "right" }}>
                {tx.amount.toFixed(2)}
              </td>
              <td style={{ padding: "0.5rem" }}>{tx.description || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
