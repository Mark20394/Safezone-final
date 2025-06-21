import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const API = "http://localhost:5000/api"; // Update if your backend URL differs

export default function StockMarket({ user, code }) {
  const [stocks, setStocks] = useState([]);
  const [message, setMessage] = useState("");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 600000); // Auto update every 10 mins
    return () => clearInterval(interval);
  }, []);

  const fetchStocks = async () => {
    try {
      const res = await axios.get(`${API}/stocks`);
      setStocks(res.data);
    } catch {
      setMessage("Failed to fetch stocks");
    }
  };

  const buyStock = async () => {
    if (!symbol || quantity <= 0) {
      setMessage("Enter valid stock symbol and quantity");
      return;
    }
    try {
      const res = await axios.post(`${API}/stocks/buy`, {
        username: user.username,
        secretCode: code,
        symbol,
        quantity: Number(quantity),
      });
      setMessage(res.data.message);
      fetchStocks();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to buy stock");
    }
  };

  const sellStock = async () => {
    if (!symbol || quantity <= 0) {
      setMessage("Enter valid stock symbol and quantity");
      return;
    }
    try {
      const res = await axios.post(`${API}/stocks/sell`, {
        username: user.username,
        secretCode: code,
        symbol,
        quantity: Number(quantity),
      });
      setMessage(res.data.message);
      fetchStocks();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to sell stock");
    }
  };

  const adminUpdatePrices = async () => {
    if (user.role !== "admin") return;
    try {
      const res = await axios.post(`${API}/stocks/update-prices`, {
        username: user.username,
        secretCode: code,
      });
      setMessage(res.data.message);
      fetchStocks();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update prices");
    }
  };

  return (
    <div style={{ padding: "1rem", borderTop: "1px solid #ddd" }}>
      <h2>Stock Market</h2>
      {message && <p>{message}</p>}

      {stocks.length === 0 ? (
        <p>No stocks available.</p>
      ) : (
        <div>
          {stocks.map((stock) => (
            <div key={stock.symbol} style={{ marginBottom: "1rem" }}>
              <strong>{stock.name} ({stock.symbol})</strong> - Current Price: ${stock.price.toFixed(2)}
              <Line
                data={{
                  labels: stock.history.map((_, i) => i + 1),
                  datasets: [
                    {
                      label: stock.symbol,
                      data: stock.history,
                      borderColor: "rgba(75,192,192,1)",
                      fill: false,
                    },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false, height: 100 }}
                height={100}
              />
              <p>Holdings: {stock.holdings?.[user.username] || 0} shares</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3>Buy / Sell Stocks</h3>
        <input
          type="text"
          placeholder="Stock Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          style={{ marginRight: "0.5rem" }}
        />
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          style={{ marginRight: "0.5rem", width: "5rem" }}
        />
        <button onClick={buyStock}>Buy</button>
        <button onClick={sellStock} style={{ marginLeft: "0.5rem" }}>
          Sell
        </button>
      </div>

      {user.role === "admin" && (
        <div style={{ marginTop: "1rem" }}>
          <button onClick={adminUpdatePrices}>Admin: Update Prices Now</button>
        </div>
      )}
    </div>
  );
}
