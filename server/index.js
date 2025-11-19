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
  { name: 'Campus Burger', description: 'Classic chicken patty with cheese & special sauce', price: 85, category: 'Burgers', isAvailable: true },
  { name: 'Veggie Delight', description: 'Spicy potato patty with fresh lettuce', price: 65, category: 'Burgers', isAvailable: true },
  { name: 'Masala Fries', description: 'Crispy fries tossed in peri-peri masala', price: 50, category: 'Sides', isAvailable: true },
  { name: 'Cold Coffee', description: 'Thick blend with vanilla ice cream', price: 70, category: 'Beverages', isAvailable: true },
  { name: 'Masala Chai', description: 'Hot spiced tea, perfect for breaks', price: 20, category: 'Beverages', isAvailable: true },
  { name: 'Egg Roll', description: 'Double egg roll with spicy chutney', price: 60, category: 'Wraps', isAvailable: true },
];

// --- ROUTES ---

// Get Menu (Auto-seed if empty)
app.get('/api/menu', async (req, res) => {
  try {
    let items = await Menu.find();
    if (items.length === 0) {
      items = await Menu.insertMany(INITIAL_MENU);
    }
    // Map _id to id for frontend
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
    
    // Generate Token (Simple Random)
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