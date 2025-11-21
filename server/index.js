
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// --- SCHEMAS ---

const MenuSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  isAvailable: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  image: String
});

const OrderSchema = new mongoose.Schema({
  token: String,
  customerId: String,
  customerName: String,
  items: Array, // Store snapshot of items
  totalAmount: Number,
  status: { type: String, default: 'NEW' },
  paymentStatus: { type: String, default: 'PENDING' },
  paymentMethod: String,
  createdAt: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now }
});

// SECURITY SCHEMAS
const SpamRecordSchema = new mongoose.Schema({
  customerId: String,
  customerName: String,
  strikes: { type: Number, default: 0 },
  banCount: { type: Number, default: 0 }, // Historical ban count
  isBanned: { type: Boolean, default: false },
  banExpiresAt: { type: Number, default: 0 },
  banReason: String,
  lastStrikeAt: { type: Number, default: Date.now }
});

const SystemSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'GLOBAL_SETTINGS', unique: true },
  isBanSystemActive: { type: Boolean, default: true },
  isShopOpen: { type: Boolean, default: true }
});

const Menu = mongoose.model('Menu', MenuSchema);
const Order = mongoose.model('Order', OrderSchema);
const SpamRecord = mongoose.model('SpamRecord', SpamRecordSchema);
const SystemSettings = mongoose.model('SystemSettings', SystemSettingsSchema);

// --- INITIAL DATA SEED ---
const INITIAL_MENU = [
  // SNACKS
  { name: 'Tea', description: 'Hot Tea', price: 10, category: 'Snacks', isAvailable: true, isBestseller: true },
  { name: 'Coffee', description: 'Hot Coffee', price: 10, category: 'Snacks', isAvailable: true },
  { name: 'Cold Coffee', description: 'Chilled coffee beverage', price: 50, category: 'Snacks', isAvailable: true, isBestseller: true },
  { name: 'Fish Finger (4pcs)', description: 'Crispy fish fingers', price: 100, category: 'Snacks', isAvailable: true },
  { name: 'Fish Cutlet', description: 'Fried fish cutlet', price: 60, category: 'Snacks', isAvailable: true },
  { name: 'Potato Chips Roll (5pcs)', description: 'Crunchy potato rolls', price: 70, category: 'Snacks', isAvailable: true },
  { name: 'French Fry', description: 'Classic salted fries', price: 60, category: 'Snacks', isAvailable: true },
  { name: 'Chicken Nuggets (5pcs)', description: 'Crispy chicken bites', price: 100, category: 'Snacks', isAvailable: true },
  { name: 'Chicken Pakora (5pcs)', description: 'Fried chicken fritters', price: 80, category: 'Snacks', isAvailable: true },
  { name: 'Chicken Lolipop (4pcs)', description: 'Spicy chicken wings', price: 120, category: 'Snacks', isAvailable: true },
  { name: 'Chinese Chicken', description: 'Indo-Chinese style chicken', price: 120, category: 'Snacks', isAvailable: true },
  { name: 'Crispy Baby Corn', description: 'Fried baby corn', price: 100, category: 'Snacks', isAvailable: true },
  { name: 'Omlet', description: 'Egg omelette', price: 30, category: 'Snacks', isAvailable: true },

  // MAGGI
  { name: 'Boil Maggi', description: 'Simple boiled Maggi', price: 35, category: 'Maggi', isAvailable: true },
  { name: 'Fry Maggi', description: 'Stir fried Maggi', price: 40, category: 'Maggi', isAvailable: true },
  { name: 'Fry Egg Maggi', description: 'Fried Maggi with egg', price: 50, category: 'Maggi', isAvailable: true },
  { name: 'Fry Chicken Maggi', description: 'Fried Maggi with chicken', price: 60, category: 'Maggi', isAvailable: true },
  { name: 'Fry Egg Chicken Maggi', description: 'Fried Maggi with egg & chicken', price: 70, category: 'Maggi', isAvailable: true, isBestseller: true },

  // ROLL
  { name: 'Veg. Roll', description: 'Mixed vegetable roll', price: 30, category: 'Rolls', isAvailable: true },
  { name: 'Paneer Roll', description: 'Spiced paneer roll', price: 60, category: 'Rolls', isAvailable: true },
  { name: 'Egg Roll', description: 'Classic egg roll', price: 35, category: 'Rolls', isAvailable: true },
  { name: 'Chicken Roll', description: 'Juicy chicken roll', price: 60, category: 'Rolls', isAvailable: true, isBestseller: true },
  { name: 'Egg Chicken Roll', description: 'Chicken roll with egg', price: 70, category: 'Rolls', isAvailable: true, isBestseller: true },

  // SANDWICH
  { name: 'Veg. Sandwich', description: 'Vegetable filling', price: 35, category: 'Sandwich', isAvailable: true },
  { name: 'Corn Sandwich', description: 'Sweet corn filling', price: 45, category: 'Sandwich', isAvailable: true },
  { name: 'Paneer Sandwich', description: 'Paneer filling', price: 60, category: 'Sandwich', isAvailable: true },
  { name: 'Egg Sandwich', description: 'Boiled egg filling', price: 45, category: 'Sandwich', isAvailable: true },
  { name: 'Chicken Sandwich', description: 'Chicken filling', price: 50, category: 'Sandwich', isAvailable: true, isBestseller: true },
  { name: 'Mix Sandwich', description: 'Mixed vegetable & meat', price: 70, category: 'Sandwich', isAvailable: true },

  // CHOWMEIN
  { name: 'Veg. Chowmein', description: 'Stir fried noodles with veggies', price: 50, category: 'Chowmein', isAvailable: true },
  { name: 'Egg Chowmein', description: 'Noodles with egg', price: 60, category: 'Chowmein', isAvailable: true },
  { name: 'Chicken Chowmein', description: 'Noodles with chicken', price: 70, category: 'Chowmein', isAvailable: true },
  { name: 'Egg Chicken Chowmein', description: 'Noodles with egg & chicken', price: 80, category: 'Chowmein', isAvailable: true },

  // MOMO
  { name: 'Veg. Momo', description: 'Steamed vegetable dumplings', price: 50, category: 'Momo', isAvailable: true },
  { name: 'Veg. Fry Momo', description: 'Fried vegetable dumplings', price: 60, category: 'Momo', isAvailable: true },
  { name: 'Chicken Momo', description: 'Steamed chicken dumplings', price: 60, category: 'Momo', isAvailable: true, isBestseller: true },
  { name: 'Chicken Fry Momo', description: 'Fried chicken dumplings', price: 70, category: 'Momo', isAvailable: true },
  { name: 'Chicken Kurkure Momo', description: 'Crunchy fried momos', price: 80, category: 'Momo', isAvailable: true },

  // RICE
  { name: 'Veg. Fried Rice', description: 'Rice with mixed veggies', price: 70, category: 'Rice', isAvailable: true },
  { name: 'Egg Fried Rice', description: 'Rice with scrambled egg', price: 80, category: 'Rice', isAvailable: true },
  { name: 'Chicken Fried Rice', description: 'Rice with chicken chunks', price: 90, category: 'Rice', isAvailable: true },
  { name: 'Egg Chicken Fried Rice', description: 'Rice with egg & chicken', price: 100, category: 'Rice', isAvailable: true, isBestseller: true },

  // CHICKEN MAIN COURSE
  { name: 'Chilly Chicken (8pcs)', description: 'Spicy Indo-Chinese chicken', price: 150, category: 'Chicken', isAvailable: true },
  { name: 'Chicken Butter Masala (4pcs)', description: 'Rich creamy curry', price: 160, category: 'Chicken', isAvailable: true },
  { name: 'Chicken Curry (4pcs)', description: 'Homestyle chicken curry', price: 120, category: 'Chicken', isAvailable: true },
  { name: 'Chicken Bharta', description: 'Shredded chicken in gravy', price: 150, category: 'Chicken', isAvailable: true },

  // COMBO
  { name: 'Fried Rice + Chilli Chicken', description: '4pcs Chicken', price: 100, category: 'Combo', isAvailable: true },
  { name: 'Lachha Paratha + Chilli Chicken', description: '4pcs Chicken', price: 100, category: 'Combo', isAvailable: true },
  { name: 'Fried Rice + Panner Chilli', description: '4pcs Paneer', price: 100, category: 'Combo', isAvailable: true },
  { name: 'Fried Rice + Chicken Curry', description: '2pcs Chicken', price: 100, category: 'Combo', isAvailable: true },
  { name: 'Lachha Paratha + Chicken Kosha', description: '2pcs Chicken', price: 100, category: 'Combo', isAvailable: true }
];

// --- HELPER FUNCTIONS FOR SECURITY ---

async function getSystemSettings() {
  let settings = await SystemSettings.findOne({ key: 'GLOBAL_SETTINGS' });
  if (!settings) {
    settings = new SystemSettings();
    await settings.save();
  }
  return settings;
}

async function handleSpamStrike(customerId, customerName) {
  const settings = await getSystemSettings();
  if (!settings.isBanSystemActive) return;

  let record = await SpamRecord.findOne({ customerId });
  if (!record) {
    record = new SpamRecord({ customerId, customerName });
  }

  record.strikes += 1;
  record.lastStrikeAt = Date.now();

  // BAN LOGIC - REFINED (3 Strikes Rule)
  // Only ban if strikes reach 3.
  // Duration depends on how many times they've been banned before (banCount).
  
  if (record.strikes >= 3) {
    record.isBanned = true;
    record.banCount += 1; // Increment historical ban count
    
    // Determine duration based on Ban Level (1st, 2nd, 3rd time banned)
    if (record.banCount === 1) {
        record.banExpiresAt = Date.now() + (60 * 60 * 1000); // 1 Hour
        record.banReason = "Temp Ban (1h): 3 consecutive cancellations.";
    } else if (record.banCount === 2) {
        record.banExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 Hours
        record.banReason = "Suspension (24h): Repeated spam activity.";
    } else {
        record.banExpiresAt = Date.now() + (99 * 365 * 24 * 60 * 60 * 1000); // Permanent
        record.banReason = "PERMANENT BAN: Policy violation.";
    }
  }

  await record.save();
}

async function handleSuccessfulOrder(customerId) {
    // If an order is successfully DELIVERED, reset strikes.
    // This ensures bans only happen for CONSECUTIVE spam.
    try {
        await SpamRecord.findOneAndUpdate(
            { customerId },
            { strikes: 0 } // Reset current strike count
        );
    } catch (e) {
        console.error("Error resetting strikes", e);
    }
}

// --- ROUTES ---

// Get Menu (Auto-seed / Update)
app.get('/api/menu', async (req, res) => {
  try {
    const bulkOps = INITIAL_MENU.map(item => ({
      updateOne: {
        filter: { name: item.name },
        update: { 
            $set: { 
                description: item.description, 
                price: item.price, 
                category: item.category,
                isBestseller: item.isBestseller
            },
            $setOnInsert: { 
                name: item.name, 
                isAvailable: item.isAvailable 
            }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
       await Menu.bulkWrite(bulkOps);
    }
    
    let items = await Menu.find();
    const formatted = items.map(i => ({ id: i._id, ...i.toObject() }));
    res.json(formatted);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add New Menu Item
app.post('/api/menu', async (req, res) => {
  try {
    const newItem = new Menu(req.body);
    const saved = await newItem.save();
    res.json({ id: saved._id, ...saved.toObject() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete Menu Item
app.delete('/api/menu/:id', async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update Menu Item (Generic)
app.put('/api/menu/:id', async (req, res) => {
  try {
    // Allow updating any field passed in body (isAvailable, isBestseller, etc)
    await Menu.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const { customerId, customerName, items, totalAmount, paymentMethod } = req.body;
    
    // --- SECURITY & BAN CHECK ---
    const settings = await getSystemSettings();

    // Check Shop Status
    if (!settings.isShopOpen && customerId !== 'vendor_manual') {
        return res.status(503).json({ error: "Shop is currently closed." });
    }

    if (settings.isBanSystemActive && customerId !== 'vendor_manual') {
        const record = await SpamRecord.findOne({ customerId });
        if (record && record.isBanned) {
            // Check expiry
            if (Date.now() > record.banExpiresAt) {
                // Ban expired -> UNBAN USER & RESET STRIKES
                record.isBanned = false;
                record.strikes = 0; // RESET STRIKES so they get fresh 3 chances
                await record.save();
            } else {
                // Still banned
                return res.status(403).json({
                    error: "Account Suspended",
                    banReason: record.banReason,
                    banExpiresAt: record.banExpiresAt
                });
            }
        }
    }
    // ----------------------------

    // BYPASS FOR VENDOR MANUAL ORDERS
    if (customerId !== 'vendor_manual') {
        // 1. Check total active orders for this user (Relaxed to 10 for testing)
        const activeOrdersCount = await Order.countDocuments({
            customerId,
            status: { $in: ['NEW', 'COOKING', 'READY'] }
        });

        if (activeOrdersCount >= 10) {
            return res.status(429).json({ 
                error: "Order Limit Reached. You have too many active orders." 
            });
        }

        // 2. Cooldown check (Relaxed to 5s for testing)
        const lastOrder = await Order.findOne({ customerId }).sort({ createdAt: -1 });
        if (lastOrder) {
            const timeDiff = Date.now() - lastOrder.createdAt;
            if (timeDiff < 5000) { // 5 seconds
                return res.status(429).json({ 
                    error: "Please wait a moment before placing another order." 
                });
            }
        }
    }
    
    const token = `R-${Math.floor(Math.random() * 900) + 100}`;
    
    const newOrder = new Order({
      token,
      customerId,
      customerName,
      items,
      totalAmount,
      paymentMethod,
      status: 'NEW',
      paymentStatus: 'PENDING',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const saved = await newOrder.save();
    res.json({ id: saved._id, ...saved.toObject() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get Orders (All or User specific)
app.get('/api/orders', async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { customerId: userId } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    const formatted = orders.map(o => ({ id: o._id, ...o.toObject() }));
    res.json(formatted);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update Order Status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (order) {
        // Handle Status Logic
        if (status === 'CANCELLED') {
            if (order.customerId !== 'vendor_manual') {
                await handleSpamStrike(order.customerId, order.customerName);
            }
        } else if (status === 'DELIVERED') {
            // Success! Reset strikes for good behavior.
            if (order.customerId !== 'vendor_manual') {
                await handleSuccessfulOrder(order.customerId);
            }
        }

        await Order.findByIdAndUpdate(req.params.id, { status, updatedAt: Date.now() });
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Order not found" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update Payment Status
app.put('/api/orders/:id/payment', async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { paymentStatus: status, updatedAt: Date.now() });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- ADMIN / SECURITY ENDPOINTS ---

app.get('/api/admin/settings', async (req, res) => {
    const settings = await getSystemSettings();
    res.json(settings);
});

app.put('/api/admin/settings', async (req, res) => {
    const updates = req.body; // Handle generic updates (banSystem, shopOpen)
    await SystemSettings.findOneAndUpdate({ key: 'GLOBAL_SETTINGS' }, updates, { upsert: true });
    res.json({ success: true });
});

app.get('/api/admin/banned-users', async (req, res) => {
    const bans = await SpamRecord.find({ isBanned: true });
    res.json(bans);
});

app.post('/api/admin/unban-user', async (req, res) => {
    const { customerId } = req.body;
    // UNBAN: Reset strikes to 0 so they don't get banned immediately again.
    await SpamRecord.findOneAndUpdate({ customerId }, { isBanned: false, strikes: 0 });
    res.json({ success: true });
});

app.post('/api/admin/unban-all', async (req, res) => {
    // UNBAN ALL: Reset strikes to 0 for everyone.
    await SpamRecord.updateMany({}, { isBanned: false, strikes: 0 });
    res.json({ success: true });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));
});
