
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

const Menu = mongoose.model('Menu', MenuSchema);
const Order = mongoose.model('Order', OrderSchema);

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

// --- ROUTES ---

// Get Menu (Auto-seed / Update)
app.get('/api/menu', async (req, res) => {
  try {
    const bulkOps = INITIAL_MENU.map(item => ({
      updateOne: {
        filter: { name: item.name },
        update: { $set: item },
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

// Update Menu Item Status
app.put('/api/menu/:id', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    await Menu.findByIdAndUpdate(req.params.id, { isAvailable });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const { customerId, customerName, items, totalAmount, paymentMethod } = req.body;
    
    // --- ANTI-SPAM & RATE LIMITING LOGIC ---
    
    // 1. Check total active orders for this user
    // We do not want one person clogging the queue with 10 fake orders
    const activeOrdersCount = await Order.countDocuments({
        customerId,
        status: { $in: ['NEW', 'COOKING', 'READY'] }
    });

    if (activeOrdersCount >= 3) {
        return res.status(429).json({ 
            error: "Order Limit Reached. You have 3 active orders. Please wait for them to be completed." 
        });
    }

    // 2. Cooldown check (Optional: Prevent double clicks or scripts)
    // Check if last order was made in the last 30 seconds
    const lastOrder = await Order.findOne({ customerId }).sort({ createdAt: -1 });
    if (lastOrder) {
        const timeDiff = Date.now() - lastOrder.createdAt;
        if (timeDiff < 30000) { // 30 seconds
            return res.status(429).json({ 
                error: "Please wait a moment before placing another order." 
            });
        }
    }
    
    // ---------------------------------------

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
    await Order.findByIdAndUpdate(req.params.id, { status, updatedAt: Date.now() });
    res.json({ success: true });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));
});
