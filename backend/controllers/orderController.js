const Order = require('../models/Order');
const Service = require('../models/Service');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const SystemSetting = require('../models/SystemSetting');
const razorpayUtil = require('../config/razorpay');

// Helper to generate readable Order Numbers
const generateOrderNumber = () => {
  return 'FH-ORD-' + Math.floor(100000 + Math.random() * 900000);
};

// @desc    Create new service order (Direct Purchase / Fiverr-style)
// @route   POST /api/orders
// @access  Private (Client)
exports.createOrder = async (req, res, next) => {
  try {
    const {
      serviceId,
      packageType, // 'basic' | 'standard' | 'premium'
      requirements,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    } = req.body;

    const service = await Service.findById(serviceId).populate('freelancer');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (service.freelancer._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot purchase your own service' });
    }

    const pkg = service.packages[packageType || 'basic'];
    if (!pkg) {
      return res.status(400).json({ success: false, message: 'Invalid package selected' });
    }

    const orderAmount = pkg.price;

    // Get platform commission percent
    const commSetting = await SystemSetting.findOne({ key: 'platform_commission_percent' });
    const commPercent = commSetting ? Number(commSetting.value) : 10;
    const platformCommission = Math.round((orderAmount * commPercent) / 100);
    const freelancerEarnings = orderAmount - platformCommission;

    // Create payment record (escrow hold)
    const payment = await Payment.create({
      payer: req.user.id,
      payee: service.freelancer._id,
      amount: orderAmount,
      currency: 'INR',
      paymentMethod: 'Razorpay / UPI',
      razorpayOrderId: razorpayOrderId || `order_demo_${Date.now()}`,
      razorpayPaymentId: razorpayPaymentId || `pay_demo_${Date.now()}`,
      razorpaySignature: razorpaySignature || 'simulated_test_signature',
      status: 'held_in_escrow',
      platformFee: platformCommission
    });

    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      service: service._id,
      packageType: packageType || 'basic',
      client: req.user.id,
      freelancer: service.freelancer._id,
      amount: orderAmount,
      platformCommission,
      freelancerEarnings,
      requirements: requirements || 'Standard order requirements',
      status: 'In Progress',
      paymentStatus: 'escrow_held',
      payment: payment._id
    });

    payment.order = order._id;
    await payment.save();

    // Freelancer wallet: increase pendingBalance (held in simulated escrow)
    let wallet = await Wallet.findOne({ user: service.freelancer._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: service.freelancer._id });
    }
    wallet.pendingBalance += orderAmount;
    await wallet.save();

    // Log Escrow Hold Transaction
    await Transaction.create({
      wallet: wallet._id,
      user: service.freelancer._id,
      type: 'escrow_hold',
      amount: orderAmount,
      description: `Payment held in escrow for Order ${orderNumber} (${service.title})`,
      referenceId: order._id.toString(),
      status: 'pending'
    });

    // Notify Freelancer
    await Notification.create({
      user: service.freelancer._id,
      title: 'New Service Order Received!',
      message: `${req.user.name} ordered your service "${service.title}" (${packageType.toUpperCase()} package). ₹${orderAmount} held in escrow.`,
      type: 'order',
      link: `/orders/${order._id}`
    });

    // Notify Client
    await Notification.create({
      user: req.user.id,
      title: 'Order Placed Successfully',
      message: `Your order #${orderNumber} for "${service.title}" is in progress. The freelancer has been notified.`,
      type: 'payment',
      link: `/orders/${order._id}`
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully and payment secured in escrow.',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's orders (client or freelancer)
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'client') {
      query.client = req.user.id;
    } else if (req.user.role === 'freelancer') {
      query.freelancer = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admin sees all
    }

    const { status } = req.query;
    if (status && status !== 'All') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('service', 'title category images')
      .populate('client', 'name avatar location')
      .populate('freelancer', 'name avatar location isVerified')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('service')
      .populate('client', 'name email avatar phone location')
      .populate('freelancer', 'name email avatar phone location isVerified')
      .populate('payment');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Authorization check
    if (
      order.client._id.toString() !== req.user.id &&
      order.freelancer._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit final work delivery (Freelancer)
// @route   POST /api/orders/:id/deliver
// @access  Private (Freelancer)
exports.deliverOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only assigned freelancer can submit delivery' });
    }

    const { message } = req.body;
    let fileUrl = '';
    let fileName = '';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    order.deliveryWork = {
      message: message || 'Please find the completed project delivery attached.',
      fileUrl,
      fileName,
      submittedAt: new Date()
    };
    order.status = 'Submitted';
    await order.save();

    // Notify client
    await Notification.create({
      user: order.client,
      title: 'Order Work Delivered',
      message: `${req.user.name} delivered work for Order #${order.orderNumber}. Please review and approve or request revisions.`,
      type: 'order',
      link: `/orders/${order._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Work delivered successfully. Awaiting client approval.',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request revision on order delivery (Client)
// @route   POST /api/orders/:id/revision
// @access  Private (Client)
exports.requestRevision = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the client can request revisions' });
    }

    const { revisionNotes } = req.body;
    order.status = 'Revision Requested';
    order.revisionNotes = revisionNotes || 'Please make the requested adjustments.';
    await order.save();

    // Notify Freelancer
    await Notification.create({
      user: order.freelancer,
      title: 'Revision Requested on Order',
      message: `The client requested adjustments for Order #${order.orderNumber}: "${order.revisionNotes}"`,
      type: 'order',
      link: `/orders/${order._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Revision requested successfully',
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve order delivery & release payment (Client)
// @route   POST /api/orders/:id/approve
// @access  Private (Client)
exports.approveOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only client can approve order' });
    }

    if (order.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Order is already marked as completed' });
    }

    order.status = 'Completed';
    order.paymentStatus = 'released';
    await order.save();

    // Update payment record
    if (order.payment) {
      await Payment.findByIdAndUpdate(order.payment, {
        status: 'released',
        platformFee: order.platformCommission
      });
    }

    // Release funds into Freelancer's Wallet
    let wallet = await Wallet.findOne({ user: order.freelancer });
    if (!wallet) {
      wallet = await Wallet.create({ user: order.freelancer });
    }

    wallet.pendingBalance = Math.max(0, wallet.pendingBalance - order.amount);
    wallet.availableBalance += order.freelancerEarnings;
    wallet.totalEarnings += order.freelancerEarnings;
    await wallet.save();

    // Record Escrow Release Transaction
    await Transaction.create({
      wallet: wallet._id,
      user: order.freelancer,
      type: 'escrow_release',
      amount: order.freelancerEarnings,
      description: `Payment released for Order #${order.orderNumber} (Platform fee: ₹${order.platformCommission})`,
      referenceId: order._id.toString(),
      status: 'success'
    });

    // Notify Freelancer
    await Notification.create({
      user: order.freelancer,
      title: 'Order Completed & Funds Released!',
      message: `Client approved Order #${order.orderNumber}! ₹${order.freelancerEarnings} has been credited to your available wallet balance.`,
      type: 'payment',
      link: '/freelancer-dashboard'
    });

    // Notify Client
    await Notification.create({
      user: order.client,
      title: 'Order Completed',
      message: `You marked Order #${order.orderNumber} as completed. Please take a moment to leave a review!`,
      type: 'order',
      link: `/orders/${order._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Order completed successfully! Funds released to freelancer wallet.',
      data: order
    });
  } catch (err) {
    next(err);
  }
};
