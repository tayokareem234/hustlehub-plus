const Booking = require("../models/booking.model");
const Hustle = require("../models/hustle.model");
const Transaction = require("../models/transaction.model");


// ============================================
// CREATE BOOKING
// ============================================

const createBooking = async (req, res) => {
    try {
        const { hustleId } = req.body;

        // Check that a hustle ID was provided.
        if (!hustleId) {
            return res.status(400).json({
                success: false,
                message: "Hustle ID is required"
            });
        }

        // Find the hustle.
        const hustle = await Hustle.findById(hustleId);

        if (!hustle) {
            return res.status(404).json({
                success: false,
                message: "Hustle not found"
            });
        }

        // Prevent a freelancer from booking their own hustle.
        if (hustle.createdBy.toString() === req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You cannot book your own hustle"
            });
        }

        // Prevent duplicate active bookings.
        const existingBooking = await Booking.findOne({
            hustle: hustle._id,
            client: req.user.id,
            status: { $ne: "cancelled" }
        });

        if (existingBooking) {
            return res.status(409).json({
                success: false,
                message: "You have already booked this hustle"
            });
        }

        // Create the booking.
        const booking = await Booking.create({
            hustle: hustle._id,
            client: req.user.id,
            freelancer: hustle.createdBy,
            price: hustle.price,
            status: "confirmed"
        });

        // Create a simulated transaction for the booking.
        let transaction;

        try {
            transaction = await Transaction.create({
                booking: booking._id,
                hustle: hustle._id,
                client: req.user.id,
                freelancer: hustle.createdBy,
                amount: hustle.price,
                status: "simulated"
            });

        } catch (transactionError) {
            // Roll back the booking if its transaction
            // cannot be created.
            await Booking.findByIdAndDelete(booking._id);

            throw transactionError;
        }

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking,
            transaction
        });

    } catch (error) {
        console.error("CREATE BOOKING ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};


// ============================================
// GET CLIENT BOOKINGS
// ============================================

const getClientBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({
            client: req.user.id
        })
            .populate(
                "hustle",
                "title description category price location"
            )
            .populate("freelancer", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Client bookings retrieved successfully",
            bookings
        });

    } catch (error) {
        console.error("GET CLIENT BOOKINGS ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};


// ============================================
// GET FREELANCER BOOKINGS
// ============================================

const getFreelancerBookings = async (req, res) => {
    try {
        // Only retrieve bookings belonging to the
        // authenticated freelancer.
        const bookings = await Booking.find({
            freelancer: req.user.id
        })
            .populate(
                "hustle",
                "title description category price location"
            )
            .populate("client", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Freelancer bookings retrieved successfully",
            bookings
        });

    } catch (error) {
        console.error(
            "GET FREELANCER BOOKINGS ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};


// ============================================
// FINANCIAL CALCULATION HELPERS
// ============================================

// Round monetary values to two decimal places.
const roundMoney = (amount) => {
    return Math.round(
        (Number(amount || 0) + Number.EPSILON) * 100
    ) / 100;
};


// Retrieve the configurable tax estimation rate.
//
// Default: 20% (academic estimation assumption).
// TAX_ESTIMATE_RATE=0.20 in the environment file.

const getTaxEstimateRate = () => {
    const configuredRate = process.env.TAX_ESTIMATE_RATE;

    if (
        configuredRate === undefined ||
        configuredRate.trim() === ""
    ) {
        return 0.20;
    }

    const rate = Number(configuredRate);

    if (
        !Number.isFinite(rate) ||
        rate < 0 ||
        rate > 1
    ) {
        return 0.20;
    }

    return rate;
};


// ============================================
// GET FREELANCER INCOME AND TAX ESTIMATE
// ============================================

const getFreelancerIncome = async (req, res) => {
    try {
        // Retrieve simulated transactions belonging
        // to the authenticated freelancer.
        const transactions = await Transaction.find({
            freelancer: req.user.id,
            status: "simulated"
        })
            .populate("booking", "status")
            .populate("hustle", "title category")
            .populate("client", "name")
            .sort({ createdAt: -1 });


        // ============================================
        // FILTER ELIGIBLE TRANSACTIONS
        // ============================================

        // Exclude transactions associated with cancelled
        // or unavailable bookings.
        const eligibleTransactions = transactions.filter(
            (transaction) =>
                transaction.booking &&
                transaction.booking.status !== "cancelled"
        );


        // ============================================
        // CALCULATE GROSS INCOME
        // ============================================

        // Calculate using integer cents to minimise
        // floating-point rounding errors.
        const totalIncomeCents = eligibleTransactions.reduce(
            (total, transaction) => {
                const amount = Number(transaction.amount || 0);

                return total + Math.round(amount * 100);
            },
            0
        );

        const totalIncome = totalIncomeCents / 100;


        // ============================================
        // CALCULATE ESTIMATED TAX
        // ============================================

        const taxRate = getTaxEstimateRate();

        const estimatedTaxCents = Math.round(
            totalIncomeCents * taxRate
        );

        const estimatedTax = estimatedTaxCents / 100;


        // ============================================
        // CALCULATE NET INCOME
        // ============================================

        const netIncomeCents =
            totalIncomeCents - estimatedTaxCents;

        const netIncome = netIncomeCents / 100;


        // ============================================
        // MONTHLY INCOME SUMMARY
        // ============================================

        const now = new Date();

        const monthlyTotals = new Map();

        // Initialise the most recent six calendar months.
        for (let i = 5; i >= 0; i--) {
            const date = new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );

            const key =
                `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`;

            monthlyTotals.set(key, 0);
        }


        // Add eligible transaction amounts to their months.
        eligibleTransactions.forEach((transaction) => {
            const date = new Date(transaction.createdAt);

            if (Number.isNaN(date.getTime())) {
                return;
            }

            const key =
                `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`;

            if (monthlyTotals.has(key)) {
                const currentCents = monthlyTotals.get(key);

                const amountCents = Math.round(
                    Number(transaction.amount || 0) * 100
                );

                monthlyTotals.set(
                    key,
                    currentCents + amountCents
                );
            }
        });


        // Prepare monthly figures for the frontend.
        const monthlyIncome = Array.from(
            monthlyTotals.entries()
        ).map(([key, amountCents]) => {
            const [year, month] = key.split("-").map(Number);

            const date = new Date(year, month - 1, 1);

            return {
                year,
                month,

                label: date.toLocaleDateString("en-ZA", {
                    month: "short",
                    year: "numeric"
                }),

                income: roundMoney(amountCents / 100)
            };
        });


        // ============================================
        // RETURN FINANCIAL SUMMARY
        // ============================================

        return res.status(200).json({
            success: true,

            message:
                "Freelancer financial summary retrieved successfully",

            financialSummary: {
                grossIncome: roundMoney(totalIncome),
                estimatedTax: roundMoney(estimatedTax),
                netIncome: roundMoney(netIncome),
                taxRate,
                currency: "ZAR"
            },

            // Keep the original totalIncome property
            // to maintain compatibility with the
            // existing frontend.
            totalIncome: roundMoney(totalIncome),

            estimatedTax: roundMoney(estimatedTax),

            netIncome: roundMoney(netIncome),

            taxRate,

            // Historical transaction records.
            transactionCount: transactions.length,

            // Transactions contributing to gross income.
            incomeTransactionCount:
                eligibleTransactions.length,

            // Historical records excluded from income.
            excludedFromIncomeCount:
                transactions.length - eligibleTransactions.length,

            // Six-month financial summary.
            monthlyIncome,

            // Preserve transaction history.
            transactions
        });

    } catch (error) {
        console.error(
            "GET FREELANCER INCOME ERROR:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};


// ============================================
// CANCEL BOOKING
// ============================================

const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the booking.
        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // Only the client who created the booking
        // can cancel it.
        if (booking.client.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to cancel this booking"
            });
        }

        // Prevent cancelling an already cancelled booking.
        if (booking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Booking is already cancelled"
            });
        }

        // Cancel the booking.
        booking.status = "cancelled";

        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            booking
        });

    } catch (error) {
        console.error("CANCEL BOOKING ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
};


// ============================================
// EXPORT CONTROLLERS
// ============================================

module.exports = {
    createBooking,
    getClientBookings,
    getFreelancerBookings,
    getFreelancerIncome,
    cancelBooking
};