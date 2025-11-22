import PaymentIntent from '../Model/PaymentIntentModel.js';
import ProjectListing from '../Model/ProjectListingModel.js';
import BonusPool from '../Model/BonusPoolModel.js';
import Bidding from '../Model/BiddingModel.js';
import user from '../Model/UserModel.js';
import { createOrder as rpCreateOrder, createRefund } from '../services/razorpay.js';
import { BID_FEE, LISTING_FEE, BONUS_PER_CONTRIBUTOR, WITHDRAWAL_FEE } from '../utils/flags.js';
import { logPaymentEvent } from '../utils/logger.js';
import { ApiError } from '../utils/error.js';
import { v4 as uuid } from 'uuid';
import mongoose from 'mongoose';

// Create bid fee payment (₹9)
export const createBidFee = async (req, res) => {
  try {
    const { projectId, bidId } = req.body;
    const userId = req.user._id;

    // Check if bid fee already paid for this bid
    const existingPayment = await PaymentIntent.findOne({
      purpose: 'bid_fee',
      userId,
      projectId,
      'notes.bidId': bidId,
      status: 'paid'
    });

    if (existingPayment) {
      throw new ApiError(400, 'Bid fee already paid for this bid');
    }

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'razorpay',
      purpose: 'bid_fee',
      amount: BID_FEE,
      userId,
      projectId,
      status: 'created',
      notes: { bidId }
    });

    // Create Razorpay order
    const order = await rpCreateOrder({
      orderId: intent._id.toString(),
      amount: BID_FEE,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: 'Bid fee payment'
    });

    // Update intent with order ID
    intent.orderId = order.order_id;
    await intent.save();

    // Update bid with payment info
    await Bidding.findByIdAndUpdate(bidId, {
      'feePayment.provider': 'razorpay',
      'feePayment.orderId': order.order_id,
      'feePayment.status': 'pending'
    });

    logPaymentEvent('bid_fee_created', {
      intentId: intent._id,
      orderId: order.order_id,
      userId,
      projectId,
      bidId
    });

    res.status(201).json({
      success: true,
      message: 'Bid fee payment initiated',
      data: {
        provider: 'razorpay',
        order,
        intentId: intent._id
      }
    });

  } catch (error) {
    logPaymentEvent('bid_fee_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating bid fee payment'
    });
  }
};

// Create listing fee payment (₹199)
export const createListing = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user._id;

    // Check if listing fee already paid for this project
    const existingPayment = await PaymentIntent.findOne({
      purpose: 'listing',
      userId,
      projectId,
      status: 'paid'
    });

    if (existingPayment) {
      throw new ApiError(400, 'Listing fee already paid for this project');
    }

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'razorpay',
      purpose: 'listing',
      amount: LISTING_FEE,
      userId,
      projectId,
      status: 'created'
    });

    // Create Razorpay order
    const order = await rpCreateOrder({
      orderId: intent._id.toString(),
      amount: LISTING_FEE,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: 'Project listing fee'
    });

    // Update intent with order ID
    intent.orderId = order.order_id;
    await intent.save();

    logPaymentEvent('listing_fee_created', {
      intentId: intent._id,
      orderId: order.order_id,
      userId,
      projectId
    });

    res.status(201).json({
      success: true,
      message: 'Listing fee payment initiated',
      data: {
        provider: 'razorpay',
        order,
        intentId: intent._id
      }
    });

  } catch (error) {
    logPaymentEvent('listing_fee_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating listing fee payment'
    });
  }
};

// Create bonus pool funding (₹200 × contributors)
export const createBonus = async (req, res) => {
  try {
    const { projectId, contributorsCount, projectTitle, amountPerContributor, isNewProject } = req.body;
    const userId = req.user._id;

    let project = null;
    let minBonus = 0;

    if (isNewProject) {
      // For new projects, use the provided amount per contributor
      minBonus = amountPerContributor * contributorsCount;
    } else {
      // For existing projects, validate project ownership
      project = await ProjectListing.findOne({ _id: projectId, user: userId });
      if (!project) {
        throw new ApiError(404, 'Project not found or access denied');
      }

      // Check if bonus pool already exists and is funded
      const existingBonusPool = await BonusPool.findOne({ projectId });
      if (existingBonusPool && existingBonusPool.status === 'funded') {
        throw new ApiError(400, 'Bonus pool already funded for this project');
      }

      // Use the project's bonus pool amount if available
      if (project.bonus_pool_amount && project.bonus_pool_contributors) {
        minBonus = project.bonus_pool_amount * project.bonus_pool_contributors;
      } else {
        // Calculate minimum bonus amount
        minBonus = BONUS_PER_CONTRIBUTOR * contributorsCount;
      }
    }

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'razorpay',
      purpose: 'bonus_funding',
      amount: minBonus,
      userId,
      projectId: projectId || null,
      status: 'created',
      notes: { 
        contributorsCount,
        isNewProject,
        projectTitle,
        amountPerContributor
      }
    });

    // Create Razorpay order
    const order = await rpCreateOrder({
      orderId: intent._id.toString(),
      amount: minBonus,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: 'Bonus funding payment'
    });

    // Update intent with order ID
    intent.orderId = order.order_id;
    await intent.save();

    // Update project with bonus info (only for existing projects)
    if (projectId && project) {
      await ProjectListing.findByIdAndUpdate(projectId, {
        $set: { 
          'bonus.minRequired': minBonus,
          'bonus.razorpayOrderId': order.order_id
        }
      });
    }

    logPaymentEvent('bonus_funding_created', {
      intentId: intent._id,
      orderId: order.order_id,
      userId,
      projectId: projectId || 'new_project',
      amount: minBonus,
      contributorsCount,
      isNewProject
    });

    res.status(201).json({
      success: true,
      message: 'Bonus funding initiated',
      data: {
        provider: 'razorpay',
        order,
        intentId: intent._id,
        amount: minBonus,
        purpose: 'bonus_funding'
      }
    });

  } catch (error) {
    logPaymentEvent('bonus_funding_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating bonus funding'
    });
  }
};

// Create subscription payment with multiple plans
export const createSubscription = async (req, res) => {
  try {
    console.log('🔍 Subscription request received:', {
      body: req.body,
      user: req.user ? req.user.username : 'No user',
      userId: req.user ? req.user._id : 'No user ID'
    });
    
    const { amount, planName = 'starter', planType = 'monthly' } = req.body;
    const userId = req.user._id;

    // Import subscription plans configuration
    const { getPlanConfig, calculateSubscriptionPricing } = await import('../config/subscriptionPlans.js');
    
    // Validate plan configuration
    const planConfig = getPlanConfig(planName, planType);
    if (!planConfig) {
      throw new ApiError(400, 'Invalid subscription plan');
    }

    // Validate amount matches plan configuration
    const expectedAmount = planConfig.planDetails.price;
    if (amount !== expectedAmount) {
      throw new ApiError(400, `Invalid amount. Expected ₹${expectedAmount} for ${planName} ${planType} plan`);
    }

    // Check if user already has active subscription
    const existingSubscription = await PaymentIntent.findOne({
      purpose: 'subscription',
      userId,
      status: 'paid',
      'notes.planName': planName,
      'notes.planType': planType,
      createdAt: { $gte: new Date(Date.now() - planConfig.planDetails.duration * 24 * 60 * 60 * 1000) }
    });

    if (existingSubscription) {
      throw new ApiError(400, 'Active subscription already exists for this plan');
    }

    const subscriptionAmount = amount;
    const pricing = calculateSubscriptionPricing(planName, planType);

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'razorpay',
      purpose: 'subscription',
      amount: subscriptionAmount,
      userId,
      status: 'created',
      notes: { 
        planName,
        planType,
        duration: planConfig.planDetails.duration,
        features: planConfig.features,
        limits: planConfig.limits
      }
    });

    // Create Razorpay order
    const order = await rpCreateOrder({
      orderId: intent._id.toString(),
      amount: subscriptionAmount,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: `${planConfig.displayName} ${planType} subscription payment`
    });

    // Update intent with order ID
    intent.orderId = order.order_id;
    await intent.save();

    logPaymentEvent('subscription_created', {
      intentId: intent._id,
      orderId: order.order_id,
      userId,
      planName,
      planType,
      amount: subscriptionAmount,
      duration: planConfig.planDetails.duration
    });

    res.status(201).json({
      success: true,
      message: 'Subscription payment initiated',
      data: {
        provider: 'razorpay',
        order,
        intentId: intent._id,
        planName,
        planType,
        amount: subscriptionAmount,
        duration: planConfig.planDetails.duration,
        features: planConfig.features,
        limits: planConfig.limits,
        pricing
      }
    });

  } catch (error) {
    logPaymentEvent('subscription_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating subscription payment'
    });
  }
};

// Create withdrawal payment (₹20 fee)
export const createWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user._id;

    // Validate withdrawal amount
    if (!amount || amount <= 0 || amount > 10000) {
      throw new ApiError(400, 'Invalid withdrawal amount. Must be between ₹1 and ₹10,000');
    }

    const withdrawalFee = WITHDRAWAL_FEE; // ₹20 withdrawal fee
    const totalAmount = withdrawalFee; // User pays the fee

    // Create payment intent
    const intent = await PaymentIntent.create({
      provider: 'razorpay',
      purpose: 'withdrawal_fee',
      amount: totalAmount,
      userId,
      status: 'created',
      notes: { 
        withdrawalAmount: amount,
        fee: withdrawalFee
      }
    });

    // Create Razorpay order
    const order = await rpCreateOrder({
      orderId: intent._id.toString(),
      amount: totalAmount,
      customer: { 
        customer_id: String(userId), 
        customer_email: req.user.email, 
        customer_phone: req.user.phone || '9999999999' 
      },
      notes: 'Withdrawal fee payment'
    });

    // Update intent with order ID
    intent.orderId = order.order_id;
    await intent.save();

    logPaymentEvent('withdrawal_created', {
      intentId: intent._id,
      orderId: order.order_id,
      userId,
      withdrawalAmount: amount,
      fee: withdrawalFee
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal fee payment initiated',
      data: {
        provider: 'razorpay',
        order,
        intentId: intent._id,
        withdrawalAmount: amount,
        fee: withdrawalFee
      }
    });

  } catch (error) {
    logPaymentEvent('withdrawal_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error creating withdrawal payment'
    });
  }
};

// Process refund for failed project or cancelled payment
export const processRefund = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    // Find the payment intent
    const paymentIntent = await PaymentIntent.findOne({
      _id: paymentIntentId,
      userId: userId
    });

    if (!paymentIntent) {
      throw new ApiError(404, 'Payment intent not found');
    }

    if (paymentIntent.status === 'refunded') {
      throw new ApiError(400, 'Payment has already been refunded');
    }

    if (paymentIntent.status !== 'paid') {
      throw new ApiError(400, 'Payment must be completed before refund');
    }

    // Create refund through Razorpay
    const refund = await createRefund(
      paymentIntent.paymentId, // Use paymentId for Razorpay refunds
      `refund_${Date.now()}`,
      paymentIntent.amount,
      reason || 'User requested refund'
    );

    // Update payment intent status
    paymentIntent.status = 'refunded';
    paymentIntent.notes = {
      ...paymentIntent.notes,
      refundId: refund.refund_id,
      refundReason: reason,
      refundedAt: new Date()
    };
    await paymentIntent.save();

    // If this was a bid fee payment, update the bid status
    if (paymentIntent.purpose === 'bid_fee') {
      await Bidding.updateOne(
        { 'escrow_details.payment_intent_id': paymentIntentId },
        { 
          payment_status: 'refunded',
          'escrow_details.refunded_at': new Date()
        }
      );
    }

    logPaymentEvent('refund_processed', {
      paymentIntentId,
      userId,
      amount: paymentIntent.amount,
      reason,
      refundId: refund.refund_id
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.refund_id,
        amount: paymentIntent.amount,
        reason,
        refundedAt: new Date()
      }
    });

  } catch (error) {
    logPaymentEvent('refund_error', {
      paymentIntentId: req.params.paymentIntentId,
      error: error.message
    });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error processing refund'
    });
  }
};

// Get refund history
export const getRefundHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const refunds = await PaymentIntent.find({
      userId,
      status: 'refunded'
    })
    .populate('projectId', 'project_Title')
    .sort({ updatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await PaymentIntent.countDocuments({
      userId,
      status: 'refunded'
    });

    const formattedRefunds = refunds.map(payment => ({
      id: payment._id,
      purpose: payment.purpose,
      amount: payment.amount,
      refundReason: payment.notes?.refundReason,
      refundedAt: payment.notes?.refundedAt,
      projectTitle: payment.projectId?.project_Title || 'N/A',
      provider: payment.provider
    }));

    res.status(200).json({
      success: true,
      data: {
        refunds: formattedRefunds,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching refund history'
    });
  }
};

// Get subscription status with enhanced features
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user details with subscription info
    const User = await user.findById(userId);
    if (!User) {
      throw new ApiError(404, 'User not found');
    }

    // Import subscription plans configuration
    const { getPlanConfig, getSubscriptionBenefits } = await import('../config/subscriptionPlans.js');

    if (!User.subscription || !User.subscription.isActive) {
      return res.status(200).json({
        success: true,
        data: {
          isActive: false,
          subscription: null,
          features: {},
          benefits: []
        }
      });
    }

    // Check if subscription is still active
    const now = new Date();
    const isActive = User.subscription.expiresAt && User.subscription.expiresAt > now;

    // Get plan configuration
    const planConfig = getPlanConfig(User.subscription.planName, User.subscription.planType);
    const benefits = getSubscriptionBenefits(User.subscription.planName);

    res.status(200).json({
      success: true,
      data: {
        isActive,
        subscription: {
          id: User.subscription.paymentIntentId,
          planName: User.subscription.planName,
          planType: User.subscription.planType,
          startedAt: User.subscription.startedAt,
          expiresAt: User.subscription.expiresAt,
          autoRenew: User.subscription.autoRenew,
          razorpaySubscriptionId: User.subscription.razorpaySubscriptionId
        },
        features: User.subscription.features,
        benefits,
        planConfig: planConfig ? {
          displayName: planConfig.displayName,
          description: planConfig.description,
          limits: planConfig.limits
        } : null
      }
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error fetching subscription status'
    });
  }
};

// Get all available subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const { getAllPlans } = await import('../config/subscriptionPlans.js');
    const plans = getAllPlans();

    res.status(200).json({
      success: true,
      data: {
        plans
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans'
    });
  }
};

// Activate subscription after payment verification
export const activateSubscription = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.user._id;

    // Find the payment intent
    const paymentIntent = await PaymentIntent.findOne({
      _id: paymentIntentId,
      userId,
      purpose: 'subscription',
      status: 'paid'
    });

    if (!paymentIntent) {
      throw new ApiError(404, 'Payment intent not found or not paid');
    }

    const { planName, planType, duration, features, limits } = paymentIntent.notes;

    // Import subscription plans configuration
    const { getPlanConfig } = await import('../config/subscriptionPlans.js');
    const planConfig = getPlanConfig(planName, planType);

    if (!planConfig) {
      throw new ApiError(400, 'Invalid plan configuration');
    }

    // Calculate expiration date
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + duration * 24 * 60 * 60 * 1000);

    // Update user subscription
    const User = await user.findById(userId);
    if (!User) {
      throw new ApiError(404, 'User not found');
    }

    // Check if user already has an active subscription
    if (User.subscription && User.subscription.isActive && User.subscription.expiresAt > new Date()) {
      // Extend existing subscription
      const currentExpiry = new Date(User.subscription.expiresAt);
      const newExpiry = new Date(currentExpiry.getTime() + duration * 24 * 60 * 60 * 1000);
      
      User.subscription = {
        ...User.subscription,
        planName,
        planType,
        expiresAt: newExpiry,
        autoRenew: true,
        lastPaymentIntentId: paymentIntentId,
        features: features || planConfig.features,
        limits: limits || planConfig.limits
      };
    } else {
      // Create new subscription
      User.subscription = {
        isActive: true,
        planName,
        planType,
        startedAt,
        expiresAt,
        autoRenew: true,
        paymentIntentId: paymentIntentId,
        features: features || planConfig.features,
        limits: limits || planConfig.limits
      };
    }

    await User.save();

    logPaymentEvent('subscription_activated', {
      userId,
      planName,
      planType,
      duration,
      expiresAt: User.subscription.expiresAt,
      isExtension: User.subscription.lastPaymentIntentId ? true : false
    });

    res.status(200).json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        subscription: User.subscription,
        features: User.subscription.features,
        limits: User.subscription.limits,
        expiresAt: User.subscription.expiresAt
      }
    });

  } catch (error) {
    logPaymentEvent('subscription_activation_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error activating subscription'
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    const User = await user.findById(userId);
    if (!User) {
      throw new ApiError(404, 'User not found');
    }

    if (!User.subscription || !User.subscription.isActive) {
      throw new ApiError(400, 'No active subscription found');
    }

    // Disable auto-renewal
    User.subscription.autoRenew = false;
    await User.save();

    logPaymentEvent('subscription_cancelled', {
      userId,
      planName: User.subscription.planName,
      planType: User.subscription.planType,
      expiresAt: User.subscription.expiresAt
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully. You will retain access until your current period ends.',
      data: {
        expiresAt: User.subscription.expiresAt,
        autoRenew: false
      }
    });

  } catch (error) {
    logPaymentEvent('subscription_cancellation_error', { error: error.message });
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error cancelling subscription'
    });
  }
};

// Get bonus pools
export const getBonusPools = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all projects with bonus pools created by the user
    const projects = await ProjectListing.find({
      user: userId,
      'bonus.minRequired': { $exists: true, $gt: 0 }
    }).select('project_Title bonus createdAt');

    const bonusPools = projects.map(project => ({
      id: project._id,
      projectTitle: project.project_Title,
      minRequired: project.bonus.minRequired,
      funded: project.bonus.funded || false,
      status: project.bonus.funded ? 'active' : 'pending',
      createdAt: project.createdAt
    }));

    res.status(200).json({
      success: true,
      data: bonusPools
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bonus pools'
    });
  }
};

// Get withdrawal history
export const getWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const filter = { 
      userId, 
      purpose: 'withdrawal_fee' 
    };

    const withdrawals = await PaymentIntent.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PaymentIntent.countDocuments(filter);

    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal._id,
      amount: withdrawal.notes?.withdrawalAmount || 0,
      fee: withdrawal.notes?.fee || 0,
      status: withdrawal.status,
      provider: withdrawal.provider,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: {
        withdrawals: formattedWithdrawals,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching withdrawal history'
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { intentId } = req.params;
    const userId = req.user._id;

    const intent = await PaymentIntent.findOne({ _id: intentId, userId });
    if (!intent) {
      throw new ApiError(404, 'Payment intent not found');
    }

    res.status(200).json({
      success: true,
      data: {
        intentId: intent._id,
        status: intent.status,
        amount: intent.amount,
        purpose: intent.purpose,
        provider: intent.provider,
        orderId: intent.orderId,
        paymentId: intent.paymentId,
        createdAt: intent.createdAt,
        updatedAt: intent.updatedAt
      }
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error fetching payment status'
    });
  }
};

// Get user's payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, purpose } = req.query;

    const filter = { userId };
    if (purpose) {
      filter.purpose = purpose;
    }

    const payments = await PaymentIntent.find(filter)
      .populate('projectId', 'project_Title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PaymentIntent.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history'
    });
  }
};

// Get detailed payment analytics
export const getPaymentAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get payment statistics
    const paymentStats = await PaymentIntent.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$purpose',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get monthly trends
    const monthlyTrends = await PaymentIntent.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get recent activity
    const recentActivity = await PaymentIntent.find({
      userId,
      createdAt: { $gte: startDate }
    })
    .populate('projectId', 'project_Title')
    .sort({ createdAt: -1 })
    .limit(10);

    const analytics = {
      period,
      summary: {
        totalPayments: paymentStats.reduce((sum, stat) => sum + stat.count, 0),
        totalAmount: paymentStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
        successfulPayments: paymentStats.reduce((sum, stat) => sum + stat.successfulPayments, 0),
        failedPayments: paymentStats.reduce((sum, stat) => sum + stat.failedPayments, 0)
      },
      byPurpose: paymentStats,
      monthlyTrends: monthlyTrends.map(trend => ({
        period: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
        amount: trend.totalAmount,
        count: trend.count
      })),
      recentActivity: recentActivity.map(payment => ({
        id: payment._id,
        purpose: payment.purpose,
        amount: payment.amount,
        status: payment.status,
        provider: payment.provider,
        projectTitle: payment.projectId?.project_Title || 'N/A',
        createdAt: payment.createdAt
      }))
    };

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment analytics'
    });
  }
};

// Get user's payment summary
export const getPaymentSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's payment summary
    const summary = await PaymentIntent.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          successfulPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get user's bid statistics
    const bidStats = await Bidding.aggregate([
      {
        $match: { user_id: new mongoose.Types.ObjectId(userId) }
      },
      {
        $group: {
          _id: null,
          totalBids: { $sum: 1 },
          acceptedBids: {
            $sum: { $cond: [{ $eq: ['$bid_status', 'Accepted'] }, 1, 0] }
          },
          pendingBids: {
            $sum: { $cond: [{ $eq: ['$bid_status', 'Pending'] }, 1, 0] }
          },
          totalBidAmount: { $sum: '$total_amount' },
          totalBidFees: { $sum: '$bid_fee' }
        }
      }
    ]);

    const paymentSummary = {
      payments: summary[0] || {
        totalPayments: 0,
        totalAmount: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0
      },
      bids: bidStats[0] || {
        totalBids: 0,
        acceptedBids: 0,
        pendingBids: 0,
        totalBidAmount: 0,
        totalBidFees: 0
      }
    };

    res.status(200).json({
      success: true,
      data: paymentSummary
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment summary'
    });
  }
};

// Verify payment with Razorpay
export const verifyPaymentWithRazorpay = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;
    
    console.log(`[Payment Verification] Processing payment verification for orderId: ${orderId}, userId: ${userId}`);
    
    // Check if using mock payments
    if (process.env.MOCK_PAYMENTS === 'true') {
      // Auto-approve mock payments
      return res.status(200).json({
        success: true,
        data: {
          verified: true,
          orderId: orderId,
          paymentId: `mock_pay_${Date.now()}`,
          status: 'paid'
        }
      });
    }
    
    // Find payment intent by orderId
    const intent = await PaymentIntent.findOne({
      orderId: orderId,
      userId: userId
    });

    if (!intent) {
      console.log(`[Payment Verification] No payment intent found for orderId: ${orderId}`);
      return res.status(404).json({ 
        success: false,
        message: 'Payment intent not found',
        orderId: orderId
      });
    }

    console.log(`[Payment Verification] Found payment intent - status: ${intent.status}, purpose: ${intent.purpose}`);

    // If payment is already marked as paid, return success
    if (intent.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment is already verified',
        paymentStatus: 'paid',
        purpose: intent.purpose
      });
    }

    // Try to verify with Razorpay
    try {
      const { verifyOrderWithRazorpay } = await import('../services/razorpay.js');
      const orderVerified = await verifyOrderWithRazorpay(orderId);
      
      if (orderVerified) {
        console.log(`[Payment Verification] Order verified with Razorpay - updating payment status`);
        
        // Update payment intent status
        intent.status = 'paid';
        intent.updatedAt = new Date();
        await intent.save();
        
        // Handle different payment purposes
        switch (intent.purpose) {
          case 'subscription':
            // Activate subscription after payment verification
            try {
              const { planName, planType, duration, features, limits } = intent.notes;
              
              // Import subscription plans configuration
              const { getPlanConfig } = await import('../config/subscriptionPlans.js');
              const planConfig = getPlanConfig(planName, planType);

              if (planConfig) {
                // Calculate expiration date
                const startedAt = new Date();
                const expiresAt = new Date(startedAt.getTime() + duration * 24 * 60 * 60 * 1000);

                // Update user subscription
                const User = await user.findById(intent.userId);
                if (User) {
                  // Check if user already has an active subscription
                  if (User.subscription && User.subscription.isActive && User.subscription.expiresAt > new Date()) {
                    // Extend existing subscription
                    const currentExpiry = new Date(User.subscription.expiresAt);
                    const newExpiry = new Date(currentExpiry.getTime() + duration * 24 * 60 * 60 * 1000);
                    
                    User.subscription = {
                      ...User.subscription,
                      planName,
                      planType,
                      expiresAt: newExpiry,
                      autoRenew: true,
                      lastPaymentIntentId: intent._id.toString(),
                      features: features || planConfig.features,
                      limits: limits || planConfig.limits
                    };
                  } else {
                    // Create new subscription
                    User.subscription = {
                      isActive: true,
                      planName,
                      planType,
                      startedAt,
                      expiresAt,
                      autoRenew: true,
                      paymentIntentId: intent._id.toString(),
                      features: features || planConfig.features,
                      limits: limits || planConfig.limits
                    };
                  }

                  await User.save();
                  console.log(`[Payment Verification] Subscription activated for user: ${intent.userId}`);
                }
              }
            } catch (activationError) {
              console.error(`[Payment Verification] Error activating subscription:`, activationError);
            }
            break;
            
          case 'bonus_funding':
            // Create or update bonus pool
            const bonusAmount = intent.amount;
            const contributorCount = intent.notes?.contributorsCount || 1;
            const amountPerContributor = Math.floor(bonusAmount / contributorCount);
            const isNewProject = intent.notes?.isNewProject;
            
            if (isNewProject) {
              // For new projects, create a temporary bonus pool record
              await BonusPool.create({
                projectId: null, // Will be updated when project is created
                projectOwner: intent.userId,
                totalAmount: bonusAmount,
                contributorCount,
                amountPerContributor,
                status: 'funded',
                paymentIntentId: intent._id,
                orderId: orderId,
                fundedAt: new Date(),
                projectTitle: intent.notes?.projectTitle,
                isNewProject: true
              });
            } else {
              // For existing projects, update the bonus pool
              const updatedBonusPool = await BonusPool.findOneAndUpdate(
                { projectId: intent.projectId },
                { 
                  $set: { 
                    projectOwner: intent.userId,
                    totalAmount: bonusAmount,
                    contributorCount,
                    amountPerContributor,
                    status: 'funded',
                    paymentIntentId: intent._id,
                    orderId: orderId,
                    fundedAt: new Date()
                  } 
                },
                { upsert: true, new: true }
              );

              console.log(`[Payment Verification] Updated bonus pool: ${updatedBonusPool._id} for project: ${intent.projectId}`);
              
              await ProjectListing.findByIdAndUpdate(intent.projectId, { 
                $set: { 
                  'bonus.funded': true,
                  'bonus.razorpayOrderId': orderId
                } 
              });

              // Check if project selection is completed and create escrow wallet if possible
              try {
                const { createEscrowWalletIfReady } = await import('./EscrowWalletController.js');
                const escrowWallet = await createEscrowWalletIfReady(intent.projectId, intent.userId);
                if (escrowWallet) {
                  console.log(`[Payment Verification] Created escrow wallet for project: ${intent.projectId}`);
                }
              } catch (escrowError) {
                console.error(`[Payment Verification] Error creating escrow wallet:`, escrowError);
                // Don't fail the payment verification if escrow creation fails
              }
            }
            break;
            
          case 'bid_fee':
            // If bid does not exist, create it now
            let bidId = intent.notes?.bidId;
            if (!bidId) {
              // Create bid record from payment intent notes
              const newBid = new Bidding({
                project_id: intent.projectId,
                user_id: intent.userId,
                bid_amount: intent.notes?.bidAmount,
                bid_fee: intent.notes?.bidFee,
                total_amount: intent.notes?.totalAmount,
                year_of_experience: intent.notes?.year_of_experience,
                bid_description: intent.notes?.bid_description,
                hours_avilable_per_week: intent.notes?.hours_avilable_per_week,
                skills: intent.notes?.skills,
                bid_status: "Pending",
                payment_status: "paid",
                is_free_bid: false,
                escrow_details: {
                  provider: 'razorpay',
                  payment_intent_id: intent._id.toString(),
                  locked_at: new Date()
                }
              });
              const savedBid = await newBid.save();
              bidId = savedBid._id;
              // Update payment intent with bidId
              intent.notes.bidId = bidId.toString();
              await intent.save();
              console.log(`[Payment Verification] Created new bid: ${bidId} for project: ${intent.projectId}`);
            } else {
              // Update bid status if it exists
              await Bidding.findByIdAndUpdate(bidId, {
                payment_status: 'paid',
                'escrow_details.payment_intent_id': intent._id.toString(),
                'escrow_details.locked_at': new Date()
              });
              console.log(`[Payment Verification] Updated existing bid: ${bidId}`);
            }
            
            // Return response with bidId for bid_fee payments
            return res.status(200).json({
              success: true,
              message: 'Payment verified and bid created/activated',
              paymentStatus: 'paid',
              purpose: intent.purpose,
              bidId: bidId.toString(),
              projectId: intent.projectId
            });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Payment verified and status updated',
          paymentStatus: 'paid',
          purpose: intent.purpose
        });
      } else {
        console.log(`[Payment Verification] Order verification failed with Razorpay`);
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed with Razorpay',
          paymentStatus: intent.status
        });
      }
    } catch (verifyError) {
      console.error(`[Payment Verification] Error verifying order:`, verifyError);
      return res.status(500).json({
        success: false,
        message: 'Error verifying payment with Razorpay',
        error: verifyError.message
      });
    }

  } catch (error) {
    console.error('[Payment Verification] Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying payment',
      error: error.message 
    });
  }
};
