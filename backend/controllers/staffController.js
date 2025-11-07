import reservationModel from '../models/reservationModel.js';

// ✅ Today's Total Sales (handled by logged-in staff)
export const getTodaySalesHandledByStaff = async (req, res) => {
  try {
    const staffId = req.user.userId;
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const result = await reservationModel.aggregate([
      {
        $match: {
          handledBy: staffId,
          status: 'Paid',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" }
        }
      }
    ]);

    const totalSales = result.length ? result[0].totalSales : 0;
    res.status(200).json({ totalSales });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch today's sales", error: error.message });
  }
};

// ✅ Today's Total Reservations (handled by logged-in staff)
export const getTodayTotalReservationsByStaff = async (req, res) => {
  try {
    const staffId = req.user.userId;
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const count = await reservationModel.countDocuments({
      handledBy: staffId,
      createdAt: { $gte: start, $lte: end }
    });

    res.status(200).json({ totalReservations: count });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch today's reservation total", error: error.message });
  }
};

// ✅ Today's Total Customers (distinct, handled by logged-in staff)
export const getTodayTotalCustomersByStaff = async (req, res) => {
  try {
    const staffId = req.user.userId;
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const customers = await reservationModel.distinct('userId', {
      handledBy: staffId,
      createdAt: { $gte: start, $lte: end }
    });

    res.status(200).json({ totalCustomers: customers.length });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch today's customer total", error: error.message });
  }
};

// ✅ All Reservations (Pending + Handled by logged-in staff), latest first
export const getAllPendingAndOwnReservations = async (req, res) => {
  try {
    const staffId = req.user.userId;

    const reservations = await reservationModel.find({}).sort({ createdAt: -1 });

    res.status(200).json({ reservations });

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reservations', error: error.message });
  }
};
