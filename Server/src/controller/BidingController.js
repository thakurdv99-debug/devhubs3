import Bidding from "../Model/BiddingModel.js";
import ProjectListing from "../Model/ProjectListingModel.js";
import user from "../Model/UserModel.js";
import PaymentIntent from "../Model/PaymentIntentModel.js";
import { createOrder as rpCreateOrder } from "../services/razorpay.js";
import { logPaymentEvent } from "../utils/logger.js";
import { ApiError } from "../utils/error.js";
import mongoose from "mongoose";
import { firestoreDb } from "../config/firebaseAdmin.js";

// Check if user can place a bid (free bids or subscription)
const checkBidEligibility = async (userId) => {
  const User = await user.findById(userId);
  if (!User) {
    console.log(`[Bid Eligibility] User ${userId} not found`);
    return { canBid: false, reason: 'user_not_found' };
  }

  console.log(`[Bid Eligibility] Checking eligibility for user: ${User.username}`);
  console.log(`[Bid Eligibility] Free bids - remaining: ${User.freeBids?.remaining}, used: ${User.freeBids?.used}`);
  console.log(`[Bid Eligibility] Subscription - isActive: ${User.subscription?.isActive}, expiresAt: ${User.subscription?.expiresAt}`);

  // Initialize freeBids if not set (for existing users)
  if (!User.freeBids) {
    User.freeBids = { remaining: 5, used: 0 };
    await User.save();
    console.log(`[Bid Eligibility] Initialized freeBids for existing user`);
  }

  // Check if user has active subscription (₹3 fee)
  if (User.subscription?.isActive && User.subscription?.expiresAt > new Date()) {
    console.log(`[Bid Eligibility] User has active subscription - ₹3 fee`);
    return { canBid: true, feeAmount: 3, reason: 'subscription' };
  }

  // Check if user has free bids remaining (₹0 fee)
  if (User.freeBids.remaining > 0) {
    console.log(`[Bid Eligibility] User has ${User.freeBids.remaining} free bids remaining - ₹0 fee`);
    return { canBid: true, feeAmount: 0, reason: 'free_bid', remaining: User.freeBids.remaining };
  }

  // User needs to pay full bid fee (₹9 fee) - no free bids left
  console.log(`[Bid Eligibility] User has no free bids or subscription - ₹9 fee required`);
  return { canBid: true, feeAmount: 9, reason: 'payment_required' };
};

export const createBid = async (req, res) => {
  try {
    console.log("🚀 [createBid] Function started");
    console.log("🚀 [createBid] Request params:", req.params);
    console.log("🚀 [createBid] Request body:", req.body);
    console.log("🚀 [createBid] User from auth:", req.user ? `User: ${req.user.username}, ID: ${req.user._id}` : "No user found");
    
    // Safety check for authentication
    if (!req.user || !req.user._id) {
      console.error("❌ [createBid] Authentication failed - req.user is undefined or missing _id");
      return res.status(401).json({ 
        message: "Authentication failed. Please log in again.",
        error: "User not authenticated"
      });
    }
    
    const { _id } = req.params; // projectId - changed back to _id to match ProjectListingModel schema
    const userID = req.user._id;

    console.log("🚀 [createBid] Project ID:", _id);
    console.log("🚀 [createBid] User ID:", userID);

    const {
      bid_amount,
      year_of_experience,
      bid_description,
      hours_avilable_per_week,
      skills,
    } = req.body;

    console.log("🚀 [createBid] Bid details:", {
      bid_amount,
      year_of_experience,
      bid_description,
      hours_avilable_per_week,
      skills
    });

    // Validate project exists
    console.log("🚀 [createBid] Looking for project with ID:", _id);
    const project = await ProjectListing.findById(_id);
    console.log("🚀 [createBid] Project found:", project ? `Project: ${project.Project_Title}` : "Project not found");
    
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if project is still accepting bids
    if (project.status === 'completed' || project.status === 'in_progress') {
      return res.status(400).json({ message: "Project is no longer accepting bids" });
    }

    // Check if user already placed a bid
    const existingBid = await Bidding.findOne({
      project_id: _id,
      user_id: userID,
    });

    if (existingBid) {
      return res.status(400).json({
        message: "You have already placed a bid on this project",
      });
    }

    // Check bid eligibility
    const eligibility = await checkBidEligibility(userID);
    
    if (!eligibility.canBid) {
      return res.status(403).json({ message: "You are not eligible to place bids" });
    }

    // Calculate bid fee and total amount based on eligibility
    let bidFee = eligibility.feeAmount; // Use the fee amount from eligibility
    let totalAmount = bid_amount + bidFee;

    console.log(`[Bid Creation] Eligibility check result:`, eligibility);
    console.log(`[Bid Creation] Fee calculation - bidFee: ₹${bidFee}, totalAmount: ₹${totalAmount}, reason: ${eligibility.reason}`);

    if (eligibility.feeAmount === 0) {
      // Free bid: create bid immediately
      const newBid = new Bidding({
        project_id: _id,
        user_id: userID,
        bid_amount: bid_amount,
        bid_fee: bidFee,
        total_amount: totalAmount,
        year_of_experience,
        bid_description,
        hours_avilable_per_week,
        skills,
        bid_status: "Pending",
        payment_status: "paid", // Free bid, mark as paid
        is_free_bid: true,
        escrow_details: {
          provider: 'razorpay'
        }
      });
      const savedBid = await newBid.save();
      try {
        // Decrement user's freeBids remaining and increment used
        const User = await user.findById(userID);
        if (User) {
          if (!User.freeBids) User.freeBids = { remaining: 5, used: 0 };
          User.freeBids.remaining = Math.max(0, (User.freeBids.remaining || 0) - 1);
          User.freeBids.used = (User.freeBids.used || 0) + 1;
          await User.save();
          console.log(`[Bid Creation] Updated user freeBids: remaining=${User.freeBids.remaining}, used=${User.freeBids.used}`);
        }
      } catch (fbErr) {
        console.error('[Bid Creation] Error updating user freeBids:', fbErr);
      }
      res.status(201).json({
        message: "Bid created successfully (free bid)",
        paymentRequired: false,
        bidInfo: {
          bidId: savedBid._id,
          originalAmount: bid_amount,
          fee: 0,
          totalAmount: bid_amount,
          paymentType: 'free_bid',
          feeAmount: 0
        }
      });
      return;
    }

    // Paid bid: only create payment intent and Razorpay order, do NOT create bid yet
    const paymentIntent = await PaymentIntent.create({
      provider: 'razorpay',
      purpose: 'bid_fee',
      amount: totalAmount,
      userId: userID,
      projectId: _id,
      status: 'created',
      notes: {
        bidAmount: bid_amount,
        bidFee: bidFee,
        totalAmount: totalAmount,
        feeAmount: eligibility.feeAmount,
        feeWaived: false,
        year_of_experience,
        bid_description,
        hours_avilable_per_week,
        skills
      }
    });

    const razorpayOrder = await rpCreateOrder({
      orderId: paymentIntent._id.toString(),
      amount: totalAmount,
      customer: {
        customer_id: String(userID),
        customer_email: req.user.email,
        customer_phone: req.user.phone || '9999999999'
      },
      notes: 'Bid payment (bid amount + fee)'
    });

    paymentIntent.orderId = razorpayOrder.order_id;
    await paymentIntent.save();

    logPaymentEvent('bid_fee_intent_created', {
      intentId: paymentIntent._id,
      orderId: razorpayOrder.order_id,
      userId: userID,
      projectId: _id,
      bidAmount: bid_amount,
      bidFee: bidFee,
      totalAmount: totalAmount,
      feeAmount: eligibility.feeAmount
    });

    // Return payment data, do NOT create bid yet
    res.status(201).json({
      message: "Payment required to activate bid.",
      paymentRequired: true,
      paymentData: {
        provider: 'razorpay',
        order: razorpayOrder,
        intentId: paymentIntent._id,
        amount: totalAmount
      },
      bidInfo: {
        originalAmount: bid_amount,
        fee: bidFee,
        totalAmount: totalAmount,
        paymentType: 'paid_bid',
        feeAmount: bidFee
      }
    });

  } catch (error) {
    console.error("Error creating bid:", error.message);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
      message: isProduction ? 'Failed to create bid. Please try again.' : error.message 
    });
  }
};

export const getBid = async (req, res) => {
  try {
    // Safety check for authentication
    if (!req.user || !req.user._id) {
      console.error("❌ [getBid] Authentication failed - req.user is undefined or missing _id");
      return res.status(401).json({ 
        message: "Authentication failed. Please log in again.",
        error: "User not authenticated"
      });
    }
    
    const { _id } = req.params; // projectId - changed back to _id to match ProjectListingModel schema
    const userID = req.user._id;

    const existingBid = await Bidding.findOne({
      project_id: _id,
      user_id: userID,
    });

    // Get user's bid eligibility
    const eligibility = await checkBidEligibility(userID);

    if (!existingBid) {
      return res.status(200).json({ 
        bidExist: false,
        eligibility: eligibility
      });
    }

    // Check if bid needs payment status update
    if (existingBid.payment_status === 'pending' && existingBid.escrow_details?.payment_intent_id) {
      try {
        // Check if payment intent is marked as paid
        const paymentIntent = await PaymentIntent.findById(existingBid.escrow_details.payment_intent_id);
        if (paymentIntent && paymentIntent.status === 'paid' && existingBid.payment_status === 'pending') {
          console.log(`[getBid] Updating bid payment status from pending to paid - bidId: ${existingBid._id}`);
          
          // Update bid status
          await Bidding.findByIdAndUpdate(existingBid._id, {
            payment_status: 'paid',
            'escrow_details.locked_at': new Date()
          });
          
          // Update the existingBid object for response
          existingBid.payment_status = 'paid';
          existingBid.escrow_details.locked_at = new Date();
        }
      } catch (updateError) {
        console.error(`[getBid] Error updating bid status:`, updateError);
      }
    }

    res.status(200).json({
      message: "Bid fetched successfully",
      existingBid,
      eligibility: eligibility,
      bidStatus: {
        exists: true,
        paymentStatus: existingBid.payment_status,
        bidStatus: existingBid.bid_status,
        isActive: existingBid.payment_status === 'paid'
      }
    });
  } catch (error) {
    console.error("Error fetching bid:", error);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
      message: isProduction ? 'An error occurred. Please try again.' : error.message 
    });
  }
};

// Get user's bid statistics
export const getUserBidStats = async (req, res) => {
  try {
    // Safety check for authentication
    if (!req.user || !req.user._id) {
      console.error("❌ [getUserBidStats] Authentication failed - req.user is undefined or missing _id");
      return res.status(401).json({ 
        message: "Authentication failed. Please log in again.",
        error: "User not authenticated"
      });
    }
    
    const userId = req.user._id;

    // Get user's bid eligibility
    const eligibility = await checkBidEligibility(userId);

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

    // Get user details for free bids info
    const userDetails = await user.findById(userId).select('freeBids subscription');

    // Initialize freeBids if not set
    if (userDetails && !userDetails.freeBids) {
      userDetails.freeBids = { remaining: 5, used: 0 };
      await userDetails.save();
    }

    const stats = {
      eligibility: {
        canBid: eligibility.canBid,
        requiresPayment: true, // All bids require payment
        reason: eligibility.reason,
        feeAmount: eligibility.feeAmount,
        remaining: eligibility.remaining || 0
      },
      bids: bidStats[0] || {
        totalBids: 0,
        acceptedBids: 0,
        pendingBids: 0,
        totalBidAmount: 0,
        totalBidFees: 0
      },
      freeBids: userDetails?.freeBids || { remaining: 5, used: 0 },
      subscription: userDetails?.subscription || { isActive: false, expiresAt: null }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Error fetching bid stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bid statistics"
    });
  }
};
