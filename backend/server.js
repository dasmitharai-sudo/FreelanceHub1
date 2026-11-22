const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const seedData = require('./config/seed');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const projectRoutes = require('./routes/projectRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const smartMatchRoutes = require('./routes/smartMatchRoutes');

const Category = require('./models/Category');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/vendor', express.static(path.join(__dirname, '../node_modules')));
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', smartMatchRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'FreelanceHub',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Manual seed trigger endpoint (useful for demo/reset)
app.post('/api/seed', async (req, res) => {
  try {
    await seedData();
    res.json({ success: true, message: 'Sample database seeded successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Central Error Handler
app.use(errorHandler);

// SPA fallback for AngularJS routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;

// Initialize Database & Start Server
const startServer = async () => {
  try {
    await connectDB();

    // Check if seeding is needed
    const count = await Category.countDocuments();
    if (count === 0) {
      console.log('No categories detected. Auto-seeding initial marketplace data...');
      await seedData();
    }

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  FreelanceHub Server Running on http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
