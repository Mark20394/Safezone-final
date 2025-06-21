// backend/index.js

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const DATA_PATH = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_PATH, "users.json");
const ACCOUNTS_FILE = path.join(DATA_PATH, "accounts.json");
const PORTFOLIOS_FILE = path.join(DATA_PATH, "portfolios.json"); // per-user stock holdings
const TRANSACTIONS_FILE = path.join(DATA_PATH, "transactions.json");
const SHOP_FILE = path.join(DATA_PATH, "shop.json");
const ORDERS_FILE = path.join(DATA_PATH, "orders.json");
const STOCKS_FILE = path.join(DATA_PATH, "stocks.json");
const TAXSEASONS_FILE = path.join(DATA_PATH, "taxseasons.json");
const MINI_GAMES_FILE = path.join(DATA_PATH, "minigames.json");

// Ensure data directory and files exist with defaults
function ensureDataFiles() {
  if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH);

  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      { username: "Mark", secretCode: "0000", role: "admin" },
      { username: "Jojo", secretCode: "0000", role: "user" },
      { username: "Toto", secretCode: "0000", role: "user" },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }

  if (!fs.existsSync(ACCOUNTS_FILE)) {
    const defaultAccounts = {
      Mark: 1000,
      Jojo: 1000,
      Toto: 1000,
      CentralBank: 100000, // initial big central bank balance
    };
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(defaultAccounts, null, 2));
  }

  if (!fs.existsSync(PORTFOLIOS_FILE)) {
    const defaultPortfolios = {
      Mark: {},
      Jojo: {},
      Toto: {},
    };
    fs.writeFileSync(PORTFOLIOS_FILE, JSON.stringify(defaultPortfolios, null, 2));
  }

  if (!fs.existsSync(TRANSACTIONS_FILE)) {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(SHOP_FILE)) {
    const defaultShop = [
      { id: 1, name: "Coffee", price: 2.5 },
      { id: 2, name: "Notebook", price: 5 },
      { id: 3, name: "Pen", price: 1.25 },
    ];
    fs.writeFileSync(SHOP_FILE, JSON.stringify(defaultShop, null, 2));
  }

  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(STOCKS_FILE)) {
    // 10 companies with initial price and empty history
    const defaultStocks = [
      { symbol: "SAFE", name: "SafeZone Corp", price: 100, history: [100] },
      { symbol: "BANK", name: "Banking Inc", price: 150, history: [150] },
      { symbol: "TECH", name: "Tech Solutions", price: 200, history: [200] },
      { symbol: "FOOD", name: "Foodies Ltd", price: 120, history: [120] },
      { symbol: "AUTO", name: "AutoMakers", price: 80, history: [80] },
      { symbol: "HEALTH", name: "HealthCorp", price: 90, history: [90] },
      { symbol: "ENERGY", name: "EnergyPlus", price: 130, history: [130] },
      { symbol: "RETAIL", name: "Retailers", price: 110, history: [110] },
      { symbol: "MEDIA", name: "MediaWorks", price: 140, history: [140] },
      { symbol: "FINANCE", name: "FinancePros", price: 160, history: [160] },
    ];
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(defaultStocks, null, 2));
  }

  if (!fs.existsSync(TAXSEASONS_FILE)) {
    // tax seasons array: {id, name, startDate, endDate, taxPercent, active}
    fs.writeFileSync(TAXSEASONS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(MINI_GAMES_FILE)) {
    // Store mini games (optional for extension)
    fs.writeFileSync(MINI_GAMES_FILE, JSON.stringify([], null, 2));
  }
}

ensureDataFiles();

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Auth middleware
function authenticateUser(req, res, next) {
  const { username, secretCode } = req.body;
  if (!username || !secretCode)
    return res.status(400).json({ error: "Username and secretCode required" });
  const users = readJSON(USERS_FILE);
  const user = users.find((u) => u.username === username && u.secretCode === secretCode);
  if (!user) return res.status(401).json({ error: "Invalid username or secret code" });
  req.user = user;
  next();
}

// Helper to get current tax rate (active season) or 10% default
function getActiveTaxPercent() {
  const seasons = readJSON(TAXSEASONS_FILE);
  const now = new Date();
  const active = seasons.find(
    (s) => s.active && new Date(s.startDate) <= now && now <= new Date(s.endDate)
  );
  return active ? active.taxPercent : 10;
}

// --- LOGIN ---
app.post("/api/login", (req, res) => {
  const { username, secretCode } = req.body;
  if (!username || !secretCode)
    return res.status(400).json({ error: "Username and secretCode required" });

  const users = readJSON(USERS_FILE);
  const user = users.find((u) => u.username === username && u.secretCode === secretCode);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ username: user.username, role: user.role });
});

// --- CHANGE CODE USER ---
app.post("/api/change-code", authenticateUser, (req, res) => {
  const { newCode } = req.body;
  if (!newCode || newCode.length !== 4)
    return res.status(400).json({ error: "New code must be 4 digits" });

  const users = readJSON(USERS_FILE);
  const userIndex = users.findIndex((u) => u.username === req.user.username);
  users[userIndex].secretCode = newCode;
  writeJSON(USERS_FILE, users);

  res.json({ message: "Secret code updated" });
});

// --- ADMIN CHANGE CODE ---
app.post("/api/admin/change-code", authenticateUser, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });

  const { targetUser, newCode } = req.body;
  if (!targetUser || !newCode || newCode.length !== 4)
    return res.status(400).json({ error: "Target user and new 4-digit code required" });

  const users = readJSON(USERS_FILE);
  const userIndex = users.findIndex((u) => u.username === targetUser);
  if (userIndex === -1)
    return res.status(404).json({ error: "Target user not found" });

  users[userIndex].secretCode = newCode;
  writeJSON(USERS_FILE, users);

  res.json({ message: `Secret code for ${targetUser} updated by admin` });
});

// --- GET BALANCES ---
app.post("/api/balances", authenticateUser, (req, res) => {
  const accounts = readJSON(ACCOUNTS_FILE);
  if (req.user.role === "admin") {
    res.json(accounts);
  } else {
    res.json({ [req.user.username]: accounts[req.user.username] || 0 });
  }
});

// --- ADMIN MODIFY BALANCE ---
app.post("/api/admin/modify-balance", authenticateUser, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });

  const { targetUser, amount } = req.body;
  if (!targetUser || typeof amount !== "number")
    return res.status(400).json({ error: "targetUser and numeric amount required" });

  const accounts = readJSON(ACCOUNTS_FILE);
  if (!(targetUser in accounts))
    return res.status(404).json({ error: "Target user/account not found" });

  accounts[targetUser] += amount;
  if (accounts[targetUser] < 0) accounts[targetUser] = 0;
  writeJSON(ACCOUNTS_FILE, accounts);

  const transactions = readJSON(TRANSACTIONS_FILE);
  transactions.push({
    id: transactions.length + 1,
    timestamp: new Date().toISOString(),
    user: targetUser,
    amount: amount,
    type: amount >= 0 ? "credit" : "debit",
    description: "Admin adjustment",
  });
  writeJSON(TRANSACTIONS_FILE, transactions);

  res.json({ message: `Balance updated for ${targetUser}`, newBalance: accounts[targetUser] });
});

// --- GET TRANSACTIONS ---
app.post("/api/transactions", authenticateUser, (req, res) => {
  const transactions = readJSON(TRANSACTIONS_FILE);
  if (req.user.role === "admin") {
    res.json(transactions);
  } else {
    res.json(transactions.filter((t) => t.user === req.user.username));
  }
});

// --- SHOP ---

// Get all shop items
app.get("/api/shop/items", (req, res) => {
  const items = readJSON(SHOP_FILE);
  res.json(items);
});

// Place an order (user)
app.post("/api/shop/order", authenticateUser, (req, res) => {
  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ error: "Item ID required" });

  const accounts = readJSON(ACCOUNTS_FILE);
  const items = readJSON(SHOP_FILE);
  const orders = readJSON(ORDERS_FILE);

  const item = items.find((i) => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Item not found" });

  const userAccount = accounts[req.user.username] ?? 0;
  if (userAccount < item.price)
    return res.status(400).json({ error: "Insufficient funds" });

  // Deduct from user balance
  accounts[req.user.username] -= item.price;
  writeJSON(ACCOUNTS_FILE, accounts);

  // Create order with status 'pending'
  const order = {
    id: orders.length + 1,
    user: req.user.username,
    itemId: item.id,
    itemName: item.name,
    price: item.price,
    status: "pending",
    timestamp: new Date().toISOString(),
  };
  orders.push(order);
  writeJSON(ORDERS_FILE, orders);

  res.json({ message: "Order placed and pending approval", order });
});

// Admin view all orders
app.post("/api/orders", authenticateUser, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });
  const orders = readJSON(ORDERS_FILE);
  res.json(orders);
});

// Admin approve or decline order
app.post("/api/orders/decision", authenticateUser, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });
  const { orderId, decision } = req.body;
  if (!orderId || !["approved", "declined"].includes(decision))
    return res.status(400).json({ error: "Order ID and valid decision required" });

  const orders = readJSON(ORDERS_FILE);
  const accounts = readJSON(ACCOUNTS_FILE);

  const orderIndex = orders.findIndex((o) => o.id === orderId);
  if (orderIndex === -1) return res.status(404).json({ error: "Order not found" });

  const order = orders[orderIndex];
  if (order.status !== "pending")
    return res.status(400).json({ error: "Order already decided" });

  if (decision === "declined") {
    // Refund user balance
    accounts[order.user] += order.price;
    orders[orderIndex].status = "declined";
    writeJSON(ACCOUNTS_FILE, accounts);
    writeJSON(ORDERS_FILE, orders);
    return res.json({ message: "Order declined and user refunded" });
  }

  if (decision === "approved") {
    orders[orderIndex].status = "approved";
    writeJSON(ORDERS_FILE, orders);
    return res.json({ message: "Order approved" });
  }
});

// --- ADMIN SHOP MANAGEMENT ---

// Add shop item
app.post("/api/admin/shop/add", authenticateUser, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });

  const { name, price } = req.body;
  if (!name || typeof price !== "number" || price <= 0)
    return res.status(400).json({ error: "Valid name and price required" });

  const items = readJSON(SHOP_FILE);
  const newId = items.length > 0 ? items[items.length - 1].id + 1 : 1;

  items.push({ id: newId, name, price });
  writeJSON(SHOP_FILE, items);

  res.json({ message: "Shop item added" });
});

// Edit shop item
app.post("/api/admin/shop/edit", authenticateUser, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });

  const { id, name, price } = req.body;
  if (!id || !name || typeof price !== "number" || price <= 0)
    return res.status(400).json({ error: "Valid id, name and price required" });

  const items = readJSON(SHOP_FILE);
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return res.status(404).json({ error: "Item not found" });

  items[index].name = name;
  items[index].price = price;
  writeJSON(SHOP_FILE, items);

  res.json({ message: "Shop item updated" });
});

// Delete shop item
app.post("/api/admin/shop/delete", authenticateUser, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Item id required" });

  let items = readJSON(SHOP_FILE);
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return res.status(404).json({ error: "Item not found" });

  items = items.filter((i) => i.id !== id);
  writeJSON(SHOP_FILE, items);

  res.json({ message: "Shop item deleted" });
});

// --- STOCK MARKET ---

// Get stocks info
app.get("/api/stocks", (req, res) => {
  const stocks = readJSON(STOCKS_FILE);
  res.json(stocks);
});

// Get user portfolio
app.post("/api/stocks/portfolio", authenticateUser, (req, res) => {
  const portfolios = readJSON(PORTFOLIOS_FILE);
  const userPortfolio = portfolios[req.user.username] || {};
  res.json(userPortfolio);
});

// Buy stocks
app.post("/api/stocks/buy", authenticateUser, (req, res) => {
  const { symbol, quantity } = req.body;
  if (!symbol || !quantity || quantity <= 0)
    return res.status(400).json({ error: "Valid symbol and quantity required" });

  const accounts = readJSON(ACCOUNTS_FILE);
  const stocks = readJSON(STOCKS_FILE);
  const portfolios = readJSON(PORTFOLIOS_FILE);
  const transactions = readJSON(TRANSACTIONS_FILE);

  const stock = stocks.find((s) => s.symbol === symbol);
  if (!stock) return res.status(404).json({ error: "Stock symbol not found" });

  const totalPrice = +(stock.price * quantity).toFixed(2);
  if ((accounts[req.user.username] || 0) < totalPrice)
    return res.status(400).json({ error: "Insufficient funds" });

  // Deduct money from user account
  accounts[req.user.username] -= totalPrice;

  // Update portfolio
  const userPortfolio = portfolios[req.user.username] || {};
  userPortfolio[symbol] = (userPortfolio[symbol] || 0) + quantity;
  portfolios[req.user.username] = userPortfolio;

  // Save updated data
  writeJSON(ACCOUNTS_FILE, accounts);
  writeJSON(PORTFOLIOS_FILE, portfolios);

  // Log transaction (type = buy)
  transactions.push({
    id: transactions.length + 1,
    timestamp: new Date().toISOString(),
    user: req.user.username,
    amount: -totalPrice,
    type: "buy",
    stockSymbol: symbol,
    quantity,
    pricePerStock: stock.price,
    taxPaid: 0,
  });

  writeJSON(TRANSACTIONS_FILE, transactions);

  res.json({ message: `Bought ${quantity} shares of ${symbol}` });
});

// Sell stocks
app.post("/api/stocks/sell", authenticateUser, (req, res) => {
  const { symbol, quantity } = req.body;
  if (!symbol || !quantity || quantity <= 0)
    return res.status(400).json({ error: "Valid symbol and quantity required" });

  const accounts = readJSON(ACCOUNTS_FILE);
  const stocks = readJSON(STOCKS_FILE);
  const portfolios = readJSON(PORTFOLIOS_FILE);
  const transactions = readJSON(TRANSACTIONS_FILE);

  const stock = stocks.find((s) => s.symbol === symbol);
  if (!stock) return res.status(404).json({ error: "Stock symbol not found" });

  const userPortfolio = portfolios[req.user.username] || {};
  if ((userPortfolio[symbol] || 0) < quantity)
    return res.status(400).json({ error: "You don't own that many shares" });

  const sellPrice = +(stock.price * quantity).toFixed(2);
  // Calculate profit for tax (assume profit = sellPrice - (avg buy price))  
  // For simplicity, we'll just tax 10% of sellPrice as gains tax.
  const taxPercent = getActiveTaxPercent();
  const taxAmount = +(sellPrice * (taxPercent / 100)).toFixed(2);
  const userReceives = +(sellPrice - taxAmount).toFixed(2);

  // Remove stocks from portfolio
  userPortfolio[symbol] -= quantity;
  if (userPortfolio[symbol] <= 0) delete userPortfolio[symbol];
  portfolios[req.user.username] = userPortfolio;

  // Pay user after tax, tax goes to CentralBank
  accounts[req.user.username] += userReceives;
  accounts["CentralBank"] += taxAmount;

  writeJSON(ACCOUNTS_FILE, accounts);
  writeJSON(PORTFOLIOS_FILE, portfolios);

  transactions.push({
    id: transactions.length + 1,
    timestamp: new Date().toISOString(),
    user: req.user.username,
    amount: userReceives,
    type: "sell",
    stockSymbol: symbol,
    quantity,
    pricePerStock: stock.price,
    taxPaid: taxAmount,
  });
  writeJSON(TRANSACTIONS_FILE, transactions);

  res.json({ message: `Sold ${quantity} shares of ${symbol}. Tax paid: $${taxAmount}` });
});

// Admin update stock price
app.post("/api/admin/stocks/update", authenticateUser, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });

  const { symbol, newPrice } = req.body;
  if (!symbol || typeof newPrice !== "number" || newPrice <= 0)
    return res.status(400).json({ error: "Valid symbol and positive newPrice required" });

  const stocks = readJSON(STOCKS_FILE);
  const stockIndex = stocks.findIndex((s) => s.symbol === symbol);
  if (stockIndex === -1) return res.status(404).json({ error: "Stock not found" });

  stocks[stockIndex].price = +newPrice.toFixed(2);
  stocks[stockIndex].history.push(+newPrice.toFixed(2));

  // Limit history length (e.g. last 100 entries)
  if (stocks[stockIndex].history.length > 100) stocks[stockIndex].history.shift();

  writeJSON(STOCKS_FILE, stocks);

  res.json({ message: `Stock ${symbol} price updated to $${newPrice.toFixed(2)}` });
});

// Auto update stock prices every 10 minutes (simulate random strategic changes)
function randomPriceChange(price) {
  // Random change between -5% and +5%
  const changePercent = (Math.random() * 10 - 5) / 100;
  const newPrice = price * (1 + changePercent);
  return Math.max(1, +newPrice.toFixed(2)); // min price $1
}

setInterval(() => {
  const stocks = readJSON(STOCKS_FILE);
  for (let stock of stocks) {
    const newPrice = randomPriceChange(stock.price);
    stock.price = newPrice;
    stock.history.push(newPrice);
    if (stock.history.length > 100) stock.history.shift();
  }
  writeJSON(STOCKS_FILE, stocks);
  console.log("Stock prices auto-updated");
}, 10 * 60 * 1000); // every 10 minutes

// --- TAX SEASONS ---

// Get tax seasons
app.post("/api/taxseasons", authenticateUser, (req, res) => {
  const seasons = readJSON(TAXSEASONS_FILE);
  res.json(seasons);
});

// Admin add tax season
app.post("/api/admin/taxseasons/add", authenticateUser, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });

  const { name, startDate, endDate, taxPercent } = req.body;
  if (!name || !startDate || !endDate || typeof taxPercent !== "number")
    return res.status(400).json({ error: "All fields required" });

  const seasons = readJSON(TAXSEASONS_FILE);
  const newId = seasons.length > 0 ? seasons[seasons.length - 1].id + 1 : 1;

  seasons.push({
    id: newId,
    name,
    startDate,
    endDate,
    taxPercent,
    active: true,
  });
  writeJSON(TAXSEASONS_FILE, seasons);

  res.json({ message: "Tax season added and active" });
});

// Admin end tax season (deactivate)
app.post("/api/admin/taxseasons/end", authenticateUser, (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Unauthorized" });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Tax season id required" });

  const seasons = readJSON(TAXSEASONS_FILE);
  const index = seasons.findIndex((s) => s.id === id);
  if (index === -1) return res.status(404).json({ error: "Tax season not found" });

  seasons[index].active = false;
  writeJSON(TAXSEASONS_FILE, seasons);

  res.json({ message: "Tax season ended" });
});

// --- MINI GAMES ---

// Play mini game (example random win between $10-$100)
app.post("/api/minigames/play", authenticateUser, (req, res) => {
  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: "gameId required" });

  // For simplicity, assume games are hardcoded with ids 1,2,3
  const games = {
    1: "Guess Number",
    2: "Coin Flip",
    3: "Quick Math",
  };

  if (!games[gameId]) return res.status(400).json({ error: "Invalid gameId" });

  const accounts = readJSON(ACCOUNTS_FILE);
  const transactions = readJSON(TRANSACTIONS_FILE);

  // Central bank must have enough money
  const centralBankBalance = accounts["CentralBank"] || 0;
  if (centralBankBalance < 10)
    return res.status(400).json({ error: "Central bank has insufficient funds for winnings" });

  // Random winning $10-$100
  const winning = Math.floor(Math.random() * 91) + 10;

  if (winning > centralBankBalance)
    return res.status(400).json({ error: "Central bank has insufficient funds for this winning" });

  const taxPercent = getActiveTaxPercent();
  const taxAmount = Math.floor(winning * (taxPercent / 100));
  const userReceives = winning - taxAmount;

  // Transfer money
  accounts["CentralBank"] -= winning;
  accounts[req.user.username] = (accounts[req.user.username] || 0) + userReceives;
  accounts["CentralBank"] += taxAmount; // tax back to central bank

  writeJSON(ACCOUNTS_FILE, accounts);

  transactions.push({
    id: transactions.length + 1,
    timestamp: new Date().toISOString(),
    user: req.user.username,
    amount: userReceives,
    type: "minigame_win",
    gameId,
    winning,
    taxPaid: taxAmount,
  });
  writeJSON(TRANSACTIONS_FILE, transactions);

  res.json({
    message: `You won $${winning}! After tax ($${taxAmount}), you received $${userReceives}.`,
    winning,
    taxPaid: taxAmount,
    received: userReceives,
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
