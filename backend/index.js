const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

const DATA_PATH = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_PATH, 'users.json');
const ACCOUNTS_FILE = path.join(DATA_PATH, 'accounts.json');
const TRANSACTIONS_FILE = path.join(DATA_PATH, 'transactions.json');
const SHOP_FILE = path.join(DATA_PATH, 'shop.json');
const STOCKS_FILE = path.join(DATA_PATH, 'stocks.json');
const TAXSEASONS_FILE = path.join(DATA_PATH, 'taxseasons.json');
const ORDERS_FILE = path.join(DATA_PATH, 'orders.json');

// Ensure data folder and files exist
function ensureDataFiles() {
  if (!fs.existsSync(DATA_PATH)) fs.mkdirSync(DATA_PATH);

  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      { username: "Mark", secretCode: "0000", role: "admin" },
      { username: "Jojo", secretCode: "0000", role: "user" },
      { username: "Toto", secretCode: "0000", role: "user" }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }

  if (!fs.existsSync(ACCOUNTS_FILE)) {
    const defaultAccounts = {
      "Mark": 1000,
      "Jojo": 1000,
      "Toto": 1000,
      "CentralBank": 10000
    };
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(defaultAccounts, null, 2));
  }

  if (!fs.existsSync(TRANSACTIONS_FILE)) {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(SHOP_FILE)) {
    fs.writeFileSync(SHOP_FILE, JSON.stringify([
      { id: 1, name: "Coffee", price: 2.5 },
      { id: 2, name: "Notebook", price: 5 },
      { id: 3, name: "Pen", price: 1.25 }
    ], null, 2));
  }

  if (!fs.existsSync(STOCKS_FILE)) {
    const defaultStocks = [
      {
        "symbol": "SAFE",
        "name": "SafeZone Corp",
        "price": 100,
        "history": [100],
        "holdings": { "Mark": 0, "Jojo": 0, "Toto": 0 }
      },
      {
        "symbol": "BANK",
        "name": "Banking Inc",
        "price": 120,
        "history": [120],
        "holdings": { "Mark": 0, "Jojo": 0, "Toto": 0 }
      },
      {
        "symbol": "TECH",
        "name": "Tech Solutions",
        "price": 150,
        "history": [150],
        "holdings": { "Mark": 0, "Jojo": 0, "Toto": 0 }
      },
      {
        "symbol": "FOOD",
        "name": "Foodies Ltd",
        "price": 80,
        "history": [80],
        "holdings": { "Mark": 0, "Jojo": 0, "Toto": 0 }
      },
      {
        "symbol": "AUTO",
        "name": "AutoDrive",
        "price": 110,
        "history": [110],
        "holdings": { "Mark": 0, "Jojo": 0, "Toto": 0 }
      },
      {
        "symbol": "ENERGY",
        "name": "Green Energy Co",
        "price": 90,
        "history": [90],
        "holdings": { "Mark": 0, "Jojo": 0, "Toto": 0 }
      },
      {
        "symbol": "MED",
        "name": "MediCare Ltd",
        "price": 130,
        "history": [130],
        "holdings": { "Mark": 0, "Jojo": 0, "Toto": 0 }
      },
      {
        "symbol": "BUILD",
        "name": "BuildStrong",
        "price": 70,
        "history": [70],
        "holdings": { "Mark": 0, "Jojo": 0, "Toto": 0 }
      },
      {
        "symbol": "CLOTH",
        "name": "Clothify",
        "price": 60,
        "history": [60],
        "holdings": { "Mark": 0, "Jojo": 0, "Toto": 0 }
      },
      {
        "symbol": "TRVL",
        "name": "TravelNow",
        "price": 95,
        "history": [95],
        "holdings": { "Mark": 0, "Jojo": 0, "Toto": 0 }
      }
    ];
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(defaultStocks, null, 2));
  }

  if (!fs.existsSync(TAXSEASONS_FILE)) {
    fs.writeFileSync(TAXSEASONS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }
}

ensureDataFiles();

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Authenticate middleware
function authenticateUser(req, res, next) {
  const { username, secretCode } = req.body;
  if (!username || !secretCode) {
    return res.status(400).json({ error: "Username and secretCode required" });
  }
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.username === username && u.secretCode === secretCode);
  if (!user) {
    return res.status(401).json({ error: "Invalid username or secret code" });
  }
  req.user = user;
  next();
}

// --- AUTH ---
// Login
app.post('/api/login', (req, res) => {
  const { username, secretCode } = req.body;
  if (!username || !secretCode) return res.status(400).json({ error: "Username and secretCode required" });

  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.username === username && u.secretCode === secretCode);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ username: user.username, role: user.role });
});

// Change secret code (user)
app.post('/api/change-code', authenticateUser, (req, res) => {
  const { newCode } = req.body;
  if (!newCode || newCode.length !== 4) return res.status(400).json({ error: "New code must be 4 digits" });

  const users = readJSON(USERS_FILE);
  const idx = users.findIndex(u => u.username === req.user.username);
  users[idx].secretCode = newCode;
  writeJSON(USERS_FILE, users);

  res.json({ message: "Secret code updated" });
});

// Admin change any user's code
app.post('/api/admin/change-code', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

  const { targetUser, newCode } = req.body;
  if (!targetUser || !newCode || newCode.length !== 4) return res.status(400).json({ error: "Target user and new 4-digit code required" });

  const users = readJSON(USERS_FILE);
  const idx = users.findIndex(u => u.username === targetUser);
  if (idx === -1) return res.status(404).json({ error: "Target user not found" });

  users[idx].secretCode = newCode;
  writeJSON(USERS_FILE, users);

  res.json({ message: `Secret code for ${targetUser} updated by admin` });
});

// --- BALANCES ---
// Get balances
app.post('/api/balances', authenticateUser, (req, res) => {
  const accounts = readJSON(ACCOUNTS_FILE);
  if (req.user.role === "admin") {
    res.json(accounts);
  } else {
    res.json({ [req.user.username]: accounts[req.user.username] || 0 });
  }
});

// Admin modify balance (including CentralBank)
app.post('/api/admin/modify-balance', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

  const { targetUser, amount } = req.body;
  if (!targetUser || typeof amount !== 'number') return res.status(400).json({ error: "targetUser and numeric amount required" });

  const accounts = readJSON(ACCOUNTS_FILE);
  if (!(targetUser in accounts)) return res.status(404).json({ error: "Target user/account not found" });

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
    description: "Admin adjustment"
  });
  writeJSON(TRANSACTIONS_FILE, transactions);

  res.json({ message: `Balance updated for ${targetUser}`, newBalance: accounts[targetUser] });
});

// --- TRANSACTIONS ---
// Get transaction history
app.post('/api/transactions', authenticateUser, (req, res) => {
  const transactions = readJSON(TRANSACTIONS_FILE);
  if (req.user.role === "admin") {
    res.json(transactions);
  } else {
    res.json(transactions.filter(t => t.user === req.user.username));
  }
});

// --- SHOP ---
// Get shop items
app.get('/api/shop/items', (req, res) => {
  const items = readJSON(SHOP_FILE);
  res.json(items);
});

// User place order
app.post('/api/shop/order', authenticateUser, (req, res) => {
  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ error: "Item ID required" });

  const accounts = readJSON(ACCOUNTS_FILE);
  const items = readJSON(SHOP_FILE);
  const orders = readJSON(ORDERS_FILE);

  const item = items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: "Item not found" });

  const userAccount = accounts[req.user.username] ?? 0;
  if (userAccount < item.price) return res.status(400).json({ error: "Insufficient funds" });

  accounts[req.user.username] -= item.price;
  writeJSON(ACCOUNTS_FILE, accounts);

  const order = {
    id: orders.length + 1,
    user: req.user.username,
    itemId: item.id,
    itemName: item.name,
    price: item.price,
    status: "pending",
    timestamp: new Date().toISOString()
  };
  orders.push(order);
  writeJSON(ORDERS_FILE, orders);

  res.json({ message: "Order placed and pending approval", order });
});

// Admin view all orders
app.post('/api/orders', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
  const orders = readJSON(ORDERS_FILE);
  res.json(orders);
});

// Admin approve or decline order
app.post('/api/orders/decision', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
  const { orderId, decision } = req.body;
  if (!orderId || !['approved', 'declined'].includes(decision)) return res.status(400).json({ error: "Order ID and valid decision required" });

  const orders = readJSON(ORDERS_FILE);
  const accounts = readJSON(ACCOUNTS_FILE);

  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return res.status(404).json({ error: "Order not found" });

  const order = orders[idx];
  if (order.status !== "pending") return res.status(400).json({ error: "Order already decided" });

  if (decision === 'declined') {
    accounts[order.user] += order.price;
    orders[idx].status = 'declined';
    writeJSON(ACCOUNTS_FILE, accounts);
    writeJSON(ORDERS_FILE, orders);
    return res.json({ message: "Order declined and user refunded" });
  }

  if (decision === 'approved') {
    orders[idx].status = 'approved';
    writeJSON(ORDERS_FILE, orders);
    return res.json({ message: "Order approved" });
  }
});

// Admin add shop item
app.post('/api/admin/shop/add', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
  const { name, price } = req.body;
  if (!name || typeof price !== 'number' || price <= 0) return res.status(400).json({ error: "Valid name and positive price required" });

  const items = readJSON(SHOP_FILE);
  const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
  items.push({ id: newId, name, price });
  writeJSON(SHOP_FILE, items);

  res.json({ message: "Item added", item: { id: newId, name, price } });
});

// Admin edit shop item
app.post('/api/admin/shop/edit', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
  const { id, name, price } = req.body;
  if (!id || !name || typeof price !== 'number' || price <= 0) return res.status(400).json({ error: "Valid id, name, and price required" });

  const items = readJSON(SHOP_FILE);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: "Item not found" });

  items[idx].name = name;
  items[idx].price = price;
  writeJSON(SHOP_FILE, items);

  res.json({ message: "Item updated" });
});

// Admin delete shop item
app.post('/api/admin/shop/delete', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Item id required" });

  let items = readJSON(SHOP_FILE);
  const exists = items.some(i => i.id === id);
  if (!exists) return res.status(404).json({ error: "Item not found" });

  items = items.filter(i => i.id !== id);
  writeJSON(SHOP_FILE, items);

  res.json({ message: "Item deleted" });
});

// --- STOCK MARKET ---
// Get stocks
app.get('/api/stocks', (req, res) => {
  const stocks = readJSON(STOCKS_FILE);
  res.json(stocks);
});

// Buy stocks
app.post('/api/stocks/buy', authenticateUser, (req, res) => {
  const { symbol, quantity } = req.body;
  if (!symbol || !quantity || quantity <= 0) return res.status(400).json({ error: "Valid symbol and positive quantity required" });

  const accounts = readJSON(ACCOUNTS_FILE);
  const stocks = readJSON(STOCKS_FILE);
  const transactions = readJSON(TRANSACTIONS_FILE);

  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return res.status(404).json({ error: "Stock symbol not found" });

  const totalPrice = stock.price * quantity;
  if ((accounts[req.user.username] || 0) < totalPrice) return res.status(400).json({ error: "Insufficient funds" });

  // Deduct total price from user
  accounts[req.user.username] -= totalPrice;

  // Update holdings
  stock.holdings[req.user.username] = (stock.holdings[req.user.username] || 0) + quantity;

  // Record transaction
  transactions.push({
    id: transactions.length + 1,
    timestamp: new Date().toISOString(),
    user: req.user.username,
    amount: -totalPrice,
    type: "debit",
    description: `Bought ${quantity} shares of ${symbol}`
  });

  writeJSON(ACCOUNTS_FILE, accounts);
  writeJSON(STOCKS_FILE, stocks);
  writeJSON(TRANSACTIONS_FILE, transactions);

  res.json({ message: `Bought ${quantity} shares of ${symbol}`, newBalance: accounts[req.user.username] });
});

// Sell stocks
app.post('/api/stocks/sell', authenticateUser, (req, res) => {
  const { symbol, quantity } = req.body;
  if (!symbol || !quantity || quantity <= 0) return res.status(400).json({ error: "Valid symbol and positive quantity required" });

  const accounts = readJSON(ACCOUNTS_FILE);
  const stocks = readJSON(STOCKS_FILE);
  const transactions = readJSON(TRANSACTIONS_FILE);

  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return res.status(404).json({ error: "Stock symbol not found" });

  const userHoldings = stock.holdings[req.user.username] || 0;
  if (userHoldings < quantity) return res.status(400).json({ error: "Insufficient stock holdings to sell" });

  const totalPrice = stock.price * quantity;
  const tax = totalPrice * 0.10; // 10% tax to CentralBank
  const netGain = totalPrice - tax;

  // Deduct holdings
  stock.holdings[req.user.username] = userHoldings - quantity;

  // Add net gain to user balance
  accounts[req.user.username] = (accounts[req.user.username] || 0) + netGain;

  // Add tax to CentralBank
  accounts["CentralBank"] = (accounts["CentralBank"] || 0) + tax;

  // Record transaction
  transactions.push({
    id: transactions.length + 1,
    timestamp: new Date().toISOString(),
    user: req.user.username,
    amount: netGain,
    type: "credit",
    description: `Sold ${quantity} shares of ${symbol} (10% tax applied)`
  });

  writeJSON(ACCOUNTS_FILE, accounts);
  writeJSON(STOCKS_FILE, stocks);
  writeJSON(TRANSACTIONS_FILE, transactions);

  res.json({ message: `Sold ${quantity} shares of ${symbol}`, newBalance: accounts[req.user.username] });
});

// Admin update stock price manually
app.post('/api/admin/stocks/update-price', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

  const { symbol, newPrice } = req.body;
  if (!symbol || typeof newPrice !== 'number' || newPrice <= 0) return res.status(400).json({ error: "Valid symbol and positive newPrice required" });

  const stocks = readJSON(STOCKS_FILE);
  const idx = stocks.findIndex(s => s.symbol === symbol);
  if (idx === -1) return res.status(404).json({ error: "Stock not found" });

  stocks[idx].price = newPrice;
  stocks[idx].history.push(newPrice);
  writeJSON(STOCKS_FILE, stocks);

  res.json({ message: `Stock price for ${symbol} updated` });
});

// Automatic stock price update every 10 minutes (simulated here on server start and every 10 min)
function updateStocksRandomly() {
  const stocks = readJSON(STOCKS_FILE);
  const accounts = readJSON(ACCOUNTS_FILE);

  stocks.forEach(stock => {
    // Random % change between -5% to +5%
    const changePercent = (Math.random() * 10) - 5;
    let newPrice = stock.price + (stock.price * (changePercent / 100));
    newPrice = Math.max(newPrice, 1); // Minimum price 1

    // Update price and history
    stock.price = parseFloat(newPrice.toFixed(2));
    stock.history.push(stock.price);

    // Ensure history does not exceed 100 entries
    if (stock.history.length > 100) {
      stock.history.shift();
    }
  });

  writeJSON(STOCKS_FILE, stocks);
  // Note: No money is printed during update, no balance changes here.
}

updateStocksRandomly();
setInterval(updateStocksRandomly, 10 * 60 * 1000); // 10 minutes

// --- TAX SEASONS ---
// Get tax seasons
app.get('/api/taxseasons', (req, res) => {
  const taxSeasons = readJSON(TAXSEASONS_FILE);
  res.json(taxSeasons);
});

// Admin create tax season
app.post('/api/admin/taxseasons/create', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

  const { name, ratePercent, frequency } = req.body;
  if (!name || typeof ratePercent !== 'number' || ratePercent < 0 || !frequency) return res.status(400).json({ error: "Name, non-negative ratePercent and frequency required" });

  const taxSeasons = readJSON(TAXSEASONS_FILE);
  taxSeasons.push({
    id: taxSeasons.length + 1,
    name,
    ratePercent,
    frequency, // "weekly", "monthly", "yearly", or "custom"
    active: true,
    createdAt: new Date().toISOString()
  });
  writeJSON(TAXSEASONS_FILE, taxSeasons);

  res.json({ message: "Tax season created", taxSeasons });
});

// Admin end tax season
app.post('/api/admin/taxseasons/end', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Tax season ID required" });

  const taxSeasons = readJSON(TAXSEASONS_FILE);
  const idx = taxSeasons.findIndex(ts => ts.id === id && ts.active);
  if (idx === -1) return res.status(404).json({ error: "Active tax season not found with given ID" });

  taxSeasons[idx].active = false;
  taxSeasons[idx].endedAt = new Date().toISOString();
  writeJSON(TAXSEASONS_FILE, taxSeasons);

  res.json({ message: "Tax season ended", taxSeason: taxSeasons[idx] });
});

// Apply taxes from active tax seasons to all user balances (excluding CentralBank)
function applyTaxes() {
  const taxSeasons = readJSON(TAXSEASONS_FILE);
  const activeSeasons = taxSeasons.filter(ts => ts.active);

  if (activeSeasons.length === 0) return; // No active tax seasons

  const accounts = readJSON(ACCOUNTS_FILE);
  let totalTaxCollected = 0;

  activeSeasons.forEach(season => {
    Object.keys(accounts).forEach(user => {
      if (user === "CentralBank") return;
      const tax = accounts[user] * (season.ratePercent / 100);
      if (tax > 0) {
        accounts[user] -= tax;
        totalTaxCollected += tax;
      }
    });
  });

  accounts["CentralBank"] = (accounts["CentralBank"] || 0) + totalTaxCollected;

  writeJSON(ACCOUNTS_FILE, accounts);

  // Record transactions for taxes collected
  if (totalTaxCollected > 0) {
    const transactions = readJSON(TRANSACTIONS_FILE);
    transactions.push({
      id: transactions.length + 1,
      timestamp: new Date().toISOString(),
      user: "All Users",
      amount: -totalTaxCollected,
      type: "debit",
      description: `Tax collected from active tax seasons`
    });
    transactions.push({
      id: transactions.length + 1,
      timestamp: new Date().toISOString(),
      user: "CentralBank",
      amount: totalTaxCollected,
      type: "credit",
      description: `Tax received from active tax seasons`
    });
    writeJSON(TRANSACTIONS_FILE, transactions);
  }
}

// Endpoint for admin to trigger tax collection manually (could be automated by a cron job externally)
app.post('/api/admin/taxseasons/apply-taxes', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

  applyTaxes();

  res.json({ message: "Taxes applied from active tax seasons" });
});

// --- MINI GAMES ---
// Play a game (example: "guessNumber")
app.post('/api/games/play', authenticateUser, (req, res) => {
  const { game } = req.body;
  if (!game) return res.status(400).json({ error: "Game name required" });

  const accounts = readJSON(ACCOUNTS_FILE);
  const transactions = readJSON(TRANSACTIONS_FILE);

  const CENTRAL_BANK = "CentralBank";
  const MIN_WIN = 10;
  const MAX_WIN = 100;

  if (!(CENTRAL_BANK in accounts)) {
    return res.status(500).json({ error: "Central bank account missing" });
  }

  if (game === "guessNumber") {
    // Simple guessing game: User guesses a number 1-5, server picks randomly
    const { guess } = req.body;
    if (!guess || guess < 1 || guess > 5) return res.status(400).json({ error: "Guess a number 1-5" });

    const randomNumber = Math.floor(Math.random() * 5) + 1;
    if (guess === randomNumber) {
      const winnings = Math.floor(Math.random() * (MAX_WIN - MIN_WIN + 1)) + MIN_WIN;

      if (accounts[CENTRAL_BANK] < winnings) {
        return res.status(400).json({ error: "Central bank has insufficient funds to pay winnings" });
      }

      accounts[req.user.username] = (accounts[req.user.username] || 0) + winnings;
      accounts[CENTRAL_BANK] -= winnings;

      transactions.push({
        id: transactions.length + 1,
        timestamp: new Date().toISOString(),
        user: req.user.username,
        amount: winnings,
        type: "credit",
        description: `Won ${winnings}$ in Guess Number game`
      });

      writeJSON(ACCOUNTS_FILE, accounts);
      writeJSON(TRANSACTIONS_FILE, transactions);

      return res.json({ message: `You guessed right! You win $${winnings}`, randomNumber });
    } else {
      return res.json({ message: `Wrong guess. The number was ${randomNumber}`, randomNumber });
    }
  }

  return res.status(400).json({ error: "Unknown game" });
});

// --- ADMIN DASHBOARD DATA ---
// Get all data for admin dashboard (users, balances, transactions, orders, shop, stocks, tax seasons)
app.post('/api/admin/dashboard', authenticateUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

  const users = readJSON(USERS_FILE);
  const accounts = readJSON(ACCOUNTS_FILE);
  const transactions = readJSON(TRANSACTIONS_FILE);
  const orders = readJSON(ORDERS_FILE);
  const shopItems = readJSON(SHOP_FILE);
  const stocks = readJSON(STOCKS_FILE);
  const taxSeasons = readJSON(TAXSEASONS_FILE);

  res.json({
    users,
    accounts,
    transactions,
    orders,
    shopItems,
    stocks,
    taxSeasons
  });
});

app.listen(PORT, () => {
  console.log(`SafeZone backend running on port ${PORT}`);
});
