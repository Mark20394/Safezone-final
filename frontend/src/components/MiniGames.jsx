import React, { useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api"; // Change to your backend URL if deployed

export default function MiniGames({ username, secretCode }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const playGame = async (gameType) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/games/play`, { username, secretCode, gameType });
      setResult(res.data);
    } catch (err) {
      alert(err.response?.data?.error || "Game error");
    }
    setLoading(false);
  };

  return (
    <div style={{ border: "1px solid #444", padding: "1rem", marginTop: "1rem" }}>
      <h2>Mini Games</h2>
      <p>Play games to earn $10 - $100. Winnings are taxed 10% and paid from the Central Bank.</p>

      <button disabled={loading} onClick={() => playGame("guessNumber")}>
        Guess the Number
      </button>

      <button disabled={loading} onClick={() => playGame("coinFlip")} style={{ marginLeft: "1rem" }}>
        Coin Flip
      </button>

      {loading && <p>Playing...</p>}

      {result && (
        <div style={{ marginTop: "1rem" }}>
          {result.won ? (
            <p>You won ${result.amount.toFixed(2)}! (After 10% tax)</p>
          ) : (
            <p>You lost. Try again!</p>
          )}
        </div>
      )}
    </div>
  );
}
