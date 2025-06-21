import React, { useState, useEffect } from "react";
import axios from "axios";
import logo from "./logo.png"; // Put logo.png in /frontend folder
import './index.css';

const API = "https://safezone-final.onrender.com/api"; // Change this to deployed backend URL

// Utility to format currency
const formatCurrency = (num) => `$${num.toFixed(2)}`;

// --- LOGIN COMPONENT ---
function Login({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [code, setCode] = useState("");

  const users = ["Mark", "Jojo", "Toto"];

  const handleLoginClick = () => {
    if (!selectedUser) {
      alert("Please select a user");
      return;
    }
    onLogin(selectedUser, code || "0000");
  };

  return (
    <div>
      <h2>Login</h2>
      <div className="user-buttons">
        {users.map((u) => (
          <button
            key={u}
            onClick={() => setSelectedUser(u)}
            className={selectedUser === u ? "active" : ""}
          >
            {u}
          </button>
        ))}
      </div>
      <input
        type="password"
        placeholder="Enter secret code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleLoginClick}>Login</button>
    </div>
  );
}

// --- NAVIGATION COMPONENT ---
function Navigation({ currentPage, setPage, onLogout, isAdmin }) {
  return (
    <nav id="main-nav">
      <button
        className={`nav-btn ${currentPage === "dashboard" ? "active" : ""}`}
        onClick={() => setPage("dashboard")}
      >
        Dashboard
      </button>
      <button
        className={`nav-btn ${currentPage === "shop" ? "active" : ""}`}
        onClick={() => setPage("shop")}
      >
        Shop
      </button>
      <button
        className={`nav-btn ${currentPage === "stock" ? "active" : ""}`}
        onClick={() => setPage("stock")}
      >
        Stock Market
      </button>
      {isAdmin && (
        <>
          <button
            className={`nav-btn ${currentPage === "taxes" ? "active" : ""}`}
            onClick={() => setPage("taxes")}
          >
            Tax Seasons
          </button>
          <button
            className={`nav-btn ${currentPage === "adminShop" ? "active" : ""}`}
            onClick={() => setPage("adminShop")}
          >
            Manage Shop
          </button>
          <button
            className={`nav-btn ${currentPage === "centralBank" ? "active" : ""}`}
            onClick={() => setPage("centralBank")}
          >
            Central Bank
          </button>
          <button
            className={`nav-btn ${currentPage === "userMgmt" ? "active" : ""}`}
            onClick={() => setPage("userMgmt")}
          >
            User Mgmt
          </button>
        </>
      )}
      <button className="nav-btn logout" onClick={onLogout}>
        Logout
      </button>
    </nav>
  );
}

// --- DASHBOARD COMPONENT ---
function Dashboard({ user, balance, centralBank, userStocks, transactions }) {
  return (
    <section className="page visible" id="dashboard-section">
      <h2>Welcome, {user.username} ({user.role})</h2>
      <p><strong>Your Balance:</strong> {formatCurrency(balance[user.username] || 0)}</p>
      <p><strong>Central Bank Balance:</strong> {formatCurrency(centralBank)}</p>
      <h3>Your Stock Holdings:</h3>
      {userStocks && Object.entries(userStocks).length > 0 ? (
        <ul>
          {Object.entries(userStocks).map(([symbol, shares]) => (
            <li key={symbol}>
              {symbol}: {shares} shares
            </li>
          ))}
        </ul>
      ) : (
        <p>No stocks owned.</p>
      )}
      <h3>Recent Transactions:</h3>
      <ul style={{maxHeight: "120px", overflowY: "auto"}}>
        {transactions.slice(-10).reverse().map((t, i) => (
          <li key={i}>
            [{t.date}] {t.username}: {t.type} {t.amount ? formatCurrency(t.amount) : ""} {t.details ? `(${t.details})` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- SHOP COMPONENT ---
function Shop({ user, code, onRefresh }) {
  const [shopItems, setShopItems] = useState([]);
  const [message, setMessage] = useState("");

  const fetchShopItems = async () => {
    try {
      const res = await axios.get(`${API}/shop/items`);
      setShopItems(res.data);
    } catch {
      setMessage("Failed to load shop items.");
    }
  };

  useEffect(() => {
    fetchShopItems();
  }, []);

  const handleBuy = async (item) => {
    try {
      const res = await axios.post(`${API}/shop/buy`, {
        username: user.username,
        secretCode: code,
        itemId: item.id,
      });
      setMessage(res.data.message);
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Purchase failed");
    }
  };

  return (
    <section className="page visible" id="shop-section">
      <h2>Shop</h2>
      {message && <p className="message">{message}</p>}
      <div id="shop-items">
        {shopItems.length === 0 && <p>No items available.</p>}
        {shopItems.map((item) => (
          <div className="shop-item" key={item.id}>
            <span>{item.name} - {formatCurrency(item.price)}</span>
            <button onClick={() => handleBuy(item)}>Buy</button>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- ADMIN SHOP MANAGER ---
function AdminShopManager({ username, secretCode, onRefresh }) {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editItemId, setEditItemId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [message, setMessage] = useState("");

  const authData = { username, secretCode };

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/shop/items`);
      setItems(res.data);
    } catch {
      setMessage("Failed to fetch shop items");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

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
      setMessage(res.data.message);
      setNewName("");
      setNewPrice("");
      fetchItems();
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Add item failed");
    }
  };

  const startEdit = (item) => {
    setEditItemId(item.id);
    setEditName(item.name);
    setEditPrice(item.price);
    setMessage("");
  };

  const cancelEdit = () => {
    setEditItemId(null);
    setEditName("");
    setEditPrice("");
    setMessage("");
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
      setMessage(res.data.message);
      setEditItemId(null);
      setEditName("");
      setEditPrice("");
      fetchItems();
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Edit item failed");
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await axios.post(
        `${API}/admin/shop/delete`,
        { ...authData, id }
      );
      setMessage(res.data.message);
      fetchItems();
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Delete item failed");
    }
  };

  return (
    <section className="page visible" id="admin-shop-section">
      <h2>Admin Shop Manager</h2>
      {message && <p className="message">{message}</p>}

      <h3>Add New Item</h3>
      <div id="shop-add-form">
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
      </div>

      <h3>Existing Items</h3>
      {items.length === 0 && <p>No items in the shop.</p>}
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
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
                <strong>{item.name}</strong> - {formatCurrency(item.price)}
                <button
                  onClick={() => startEdit(item)}
                  style={{ marginLeft: "1rem" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  style={{ marginLeft: "0.5rem" }}
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- STOCK MARKET COMPONENT ---
function StockMarket({ user, code }) {
  const [stocks, setStocks] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [buyAmount, setBuyAmount] = useState("");
  const [userHoldings, setUserHoldings] = useState({});
  const [pricesUpdatedAt, setPricesUpdatedAt] = useState(null);

  const authData = { username: user.username, secretCode: code };

  // Fetch stocks and holdings
  const fetchStocks = async () => {
    try {
      const res = await axios.get(`${API}/stocks`);
      setStocks(res.data.stocks);
      setUserHoldings(res.data.userHoldings || {});
      setPricesUpdatedAt(res.data.updatedAt || null);
    } catch {
      setMessage("Failed to load stock data.");
    }
  };

  useEffect(() => {
    fetchStocks();

    // Automatic update every 10 minutes
    const interval = setInterval(() => {
      fetchStocks();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleBuy = async () => {
    if (!selectedStock) {
      alert("Select a stock to buy");
      return;
    }
    const amountNum = parseInt(buyAmount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Enter a valid number of shares to buy");
      return;
    }
    try {
      const res = await axios.post(`${API}/stocks/buy`, {
        ...authData,
        symbol: selectedStock,
        shares: amountNum,
      });
      setMessage(res.data.message);
      setBuyAmount("");
      fetchStocks();
    } catch (err) {
      setMessage(err.response?.data?.error || "Purchase failed");
    }
  };

  return (
    <section className="page visible" id="stock-section">
      <h2>Stock Market</h2>
      {message && <p className="message">{message}</p>}
      <p><small>Last updated: {pricesUpdatedAt ? new Date(pricesUpdatedAt).toLocaleString() : "N/A"}</small></p>
      <div id="stocks-list">
        {stocks.length === 0 && <p>No stocks available.</p>}
        {stocks.map((stock) => (
          <div className="stock-item" key={stock.symbol}>
            <div className="stock-item-header">
              <span>{stock.symbol} - {stock.name}</span>
              <span className="stock-price">{formatCurrency(stock.price)}</span>
            </div>
            <div className="stock-history">
              Price history: {stock.history.join(", ")}
            </div>
            <div>
              Your holdings: {userHoldings[stock.symbol] || 0} shares
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <select
          value={selectedStock || ""}
          onChange={(e) => setSelectedStock(e.target.value)}
        >
          <option value="" disabled>
            Select stock to buy
          </option>
          {stocks.map((s) => (
            <option key={s.symbol} value={s.symbol}>
              {s.symbol} - {s.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          placeholder="Number of shares"
          value={buyAmount}
          onChange={(e) => setBuyAmount(e.target.value)}
          style={{ marginLeft: "0.5rem", width: "110px" }}
        />
        <button onClick={handleBuy} style={{ marginLeft: "0.5rem" }}>
          Buy Shares
        </button>
      </div>
    </section>
  );
}

// --- TAX SEASONS COMPONENT (ADMIN) ---
function TaxSeasons({ username, secretCode }) {
  const [taxSeasons, setTaxSeasons] = useState([]);
  const [newName, setNewName] = useState("");
  const [newRate, setNewRate] = useState("");
  const [newDuration, setNewDuration] = useState("weekly");
  const [message, setMessage] = useState("");
  const authData = { username, secretCode };

  const fetchTaxSeasons = async () => {
    try {
      const res = await axios.get(`${API}/taxseasons`);
      setTaxSeasons(res.data);
    } catch {
      setMessage("Failed to load tax seasons.");
    }
  };

  useEffect(() => {
    fetchTaxSeasons();
  }, []);

  const handleAdd = async () => {
    const rateNum = parseFloat(newRate);
    if (!newName || isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      alert("Enter valid name and rate (0-100)");
      return;
    }
    try {
      const res = await axios.post(`${API}/admin/taxseasons/add`, {
        ...authData,
        name: newName,
        rate: rateNum,
        duration: newDuration,
      });
      setMessage(res.data.message);
      setNewName("");
      setNewRate("");
      fetchTaxSeasons();
    } catch (err) {
      setMessage(err.response?.data?.error || "Add tax season failed");
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("End this tax season?")) return;
    try {
      const res = await axios.post(`${API}/admin/taxseasons/end`, {
        ...authData,
        id,
      });
      setMessage(res.data.message);
      fetchTaxSeasons();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to end tax season");
    }
  };

  return (
    <section className="page visible" id="tax-section">
      <h2>Tax Seasons (Admin)</h2>
      {message && <p className="message">{message}</p>}
      <h3>Active Tax Seasons</h3>
      <ul>
        {taxSeasons.length === 0 && <li>No active tax seasons.</li>}
        {taxSeasons.map((t) => (
          <li key={t.id}>
            {t.name} - {t.rate}% - {t.duration}
            <button
              onClick={() => handleRemove(t.id)}
              style={{ marginLeft: "1rem" }}
            >
              End
            </button>
          </li>
        ))}
      </ul>
      <h3>Add New Tax Season</h3>
      <input
        type="text"
        placeholder="Name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <input
        type="number"
        step="0.01"
        placeholder="Rate %"
        value={newRate}
        onChange={(e) => setNewRate(e.target.value)}
      />
      <select
        value={newDuration}
        onChange={(e) => setNewDuration(e.target.value)}
      >
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
        <option value="custom">Custom</option>
      </select>
      <button onClick={handleAdd}>Add Tax Season</button>
    </section>
  );
}

// --- CENTRAL BANK MANAGEMENT (ADMIN) ---
function CentralBankManager({ username, secretCode, onRefresh }) {
  const [centralBankBalance, setCentralBankBalance] = useState(0);
  const [changeAmount, setChangeAmount] = useState("");
  const [message, setMessage] = useState("");
  const authData = { username, secretCode };

  const fetchCentralBank = async () => {
    try {
      const res = await axios.get(`${API}/centralbank`);
      setCentralBankBalance(res.data.balance);
    } catch {
      setMessage("Failed to load central bank balance.");
    }
  };

  useEffect(() => {
    fetchCentralBank();
  }, []);

  const handleChangeBalance = async (add) => {
    const amountNum = parseFloat(changeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Enter a positive number");
      return;
    }
    try {
      const endpoint = add
        ? `${API}/admin/centralbank/add`
        : `${API}/admin/centralbank/remove`;
      const res = await axios.post(endpoint, {
        ...authData,
        amount: amountNum,
      });
      setMessage(res.data.message);
      setChangeAmount("");
      fetchCentralBank();
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update central bank");
    }
  };

  return (
    <section className="page visible" id="centralbank-section">
      <h2>Central Bank Management</h2>
      {message && <p className="message">{message}</p>}
      <p><strong>Current Balance:</strong> {formatCurrency(centralBankBalance)}</p>
      <input
        type="number"
        step="0.01"
        placeholder="Amount"
        value={changeAmount}
        onChange={(e) => setChangeAmount(e.target.value)}
      />
      <button onClick={() => handleChangeBalance(true)}>Add Funds</button>
      <button onClick={() => handleChangeBalance(false)} style={{ marginLeft: "1rem" }}>
        Remove Funds
      </button>
    </section>
  );
}

// --- USER MANAGEMENT (ADMIN) ---
function UserManagement({ username, secretCode, onRefresh }) {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [newCode, setNewCode] = useState("");

  const authData = { username, secretCode };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`);
      setUsers(res.data);
    } catch {
      setMessage("Failed to load users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const startEdit = (user) => {
    setEditUser(user.username);
    setNewCode(user.secretCode);
    setMessage("");
  };

  const cancelEdit = () => {
    setEditUser(null);
    setNewCode("");
    setMessage("");
  };

  const saveEdit = async () => {
    if (!newCode) {
      alert("Enter a valid code");
      return;
    }
    try {
      const res = await axios.post(`${API}/admin/users/changecode`, {
        ...authData,
        username: editUser,
        newCode,
      });
      setMessage(res.data.message);
      setEditUser(null);
      setNewCode("");
      fetchUsers();
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update code");
    }
  };

  return (
    <section className="page visible" id="user-mgmt-section">
      <h2>User Management</h2>
      {message && <p className="message">{message}</p>}
      <ul>
        {users.map((u) => (
          <li key={u.username} style={{ marginBottom: "0.5rem" }}>
            <strong>{u.username}</strong> - Role: {u.role}
            {editUser === u.username ? (
              <>
                <input
                  type="password"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="New Secret Code"
                  style={{ marginLeft: "1rem" }}
                />
                <button onClick={saveEdit} style={{ marginLeft: "0.5rem" }}>
                  Save
                </button>
                <button onClick={cancelEdit} style={{ marginLeft: "0.5rem" }}>
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => startEdit(u)}
                style={{ marginLeft: "1rem" }}
              >
                Change Code
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- MINI GAMES COMPONENT ---
function MiniGames({ user, secretCode, onRefresh }) {
  const [guess, setGuess] = useState("");
  const [message, setMessage] = useState("");
  const authData = { username: user.username, secretCode };

  // Random prize 10-100$
  const getRandomPrize = () => Math.floor(Math.random() * 91) + 10;

  const playGuessNumber = async () => {
    const numGuess = parseInt(guess, 10);
    if (isNaN(numGuess) || numGuess < 1 || numGuess > 10) {
      alert("Guess must be a number between 1 and 10");
      return;
    }
    try {
      const res = await axios.post(`${API}/games/guessnumber`, {
        ...authData,
        guess: numGuess,
      });
      setMessage(res.data.message);
      setGuess("");
      onRefresh();
    } catch (err) {
      setMessage(err.response?.data?.error || "Game error");
    }
  };

  return (
    <section className="page visible" id="games-section">
      <h2>Mini Games</h2>
      {message && <p className="message">{message}</p>}

      <div id="game-guessNumber">
        <h3>Guess the Number (1-10)</h3>
        <input
          type="number"
          min="1"
          max="10"
          placeholder="Your guess"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
        />
        <button onClick={playGuessNumber}>Play</button>
      </div>

      {/* You can add more games similarly */}
    </section>
  );
}

// --- APP MAIN ---
export default function App() {
  const [user, setUser] = useState(null); // { username, role }
  const [secretCode, setSecretCode] = useState("");
  const [page, setPage] = useState("dashboard");
  const [balances, setBalances] = useState({});
  const [centralBank, setCentralBank] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [userStocks, setUserStocks] = useState({});

  // Fetch balances, central bank, transactions, user stock holdings
  const refreshData = async () => {
    if (!user) return;
    try {
      const resBalances = await axios.get(`${API}/balances`);
      setBalances(resBalances.data);
      const resCentral = await axios.get(`${API}/centralbank`);
      setCentralBank(resCentral.data.balance);
      const resTx = await axios.get(`${API}/transactions`);
      setTransactions(resTx.data);
      const resUserStocks = await axios.get(`${API}/stocks/holdings/${user.username}`);
      setUserStocks(resUserStocks.data || {});
    } catch (e) {
      console.error("Failed to refresh data", e);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  const handleLogin = async (username, code) => {
    try {
      const res = await axios.post(`${API}/login`, { username, secretCode: code });
      if (res.data.success) {
        setUser({ username, role: res.data.role });
        setSecretCode(code);
        setPage("dashboard");
      } else {
        alert("Invalid secret code");
      }
    } catch {
      alert("Login failed");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSecretCode("");
    setPage("dashboard");
    setBalances({});
    setCentralBank(0);
    setTransactions([]);
    setUserStocks({});
  };

  if (!user) {
    return (
      <div id="app">
        <header>
          <img src={logo} alt="SafeZone Bank Logo" className="logo" />
          <h1>SafeZone Bank</h1>
        </header>
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div id="app">
      <header>
        <img src={logo} alt="SafeZone Bank Logo" className="logo" />
        <h1>SafeZone Bank</h1>
      </header>
      <Navigation
        currentPage={page}
        setPage={setPage}
        onLogout={handleLogout}
        isAdmin={user.role === "admin"}
      />

      {page === "dashboard" && (
        <Dashboard
          user={user}
          balance={balances}
          centralBank={centralBank}
          userStocks={userStocks}
          transactions={transactions}
        />
      )}

      {page === "shop" && (
        <Shop user={user} code={secretCode} onRefresh={refreshData} />
      )}

      {page === "adminShop" && user.role === "admin" && (
        <AdminShopManager
          username={user.username}
          secretCode={secretCode}
          onRefresh={refreshData}
        />
      )}

      {page === "stock" && (
        <StockMarket user={user} code={secretCode} />
      )}

      {page === "taxes" && user.role === "admin" && (
        <TaxSeasons username={user.username} secretCode={secretCode} />
      )}

      {page === "centralBank" && user.role === "admin" && (
        <CentralBankManager
          username={user.username}
          secretCode={secretCode}
          onRefresh={refreshData}
        />
      )}

      {page === "userMgmt" && user.role === "admin" && (
        <UserManagement
          username={user.username}
          secretCode={secretCode}
          onRefresh={refreshData}
        />
      )}

      {page === "games" && (
        <MiniGames user={user} secretCode={secretCode} onRefresh={refreshData} />
      )}
    </div>
  );
}
