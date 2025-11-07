import facilityModel from '../models/facilityModel.js';
import userModel from '../models/userModel.js';
import reservationModel from '../models/reservationModel.js';

// 📊 ADMIN DASHBOARD SUMMARY
export const getAdminDashboardSummary = async (req, res) => {
  try {
    const filters = ['today', 'yesterday', 'monthly', 'annually'];

    // Get date ranges
    const getDateRange = (filter) => {
      const now = new Date();
      let start, end;

      switch (filter) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
          end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
          break;
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'annually':
          start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
          end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        default:
          start = null;
          end = null;
      }

      return { start, end };
    };

    // Totals
    const [totalFacilities, totalCustomers, totalStaff] = await Promise.all([
      facilityModel.countDocuments(),
      userModel.countDocuments({ userType: 'user' }),
      userModel.countDocuments({ userType: 'staff' })
    ]);

    const reservationStats = {};
    const salesStats = {};
    const customerStats = {};

    for (const filter of filters) {
      const { start, end } = getDateRange(filter);

      // Count reservations and sales (based on createdAt date)
      const [reservationCount, salesResult, customerResult] = await Promise.all([
        // Count reservations created in this period
        reservationModel.countDocuments({
          createdAt: { $gte: start, $lte: end }
        }),
        // Calculate sales from paid reservations created in this period
        reservationModel.aggregate([
          { 
            $match: {
              status: 'Paid',
              paymentStatus: 'Paid',
              createdAt: { $gte: start, $lte: end }
            }
          },
          { 
            $group: { 
              _id: null, 
              total: { $sum: '$totalPrice' }
            } 
          }
        ]),
        // Count unique customers who made reservations in this period
        reservationModel.aggregate([
          { 
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: '$userId' // Group by user to get unique customers
            }
          },
          {
            $count: 'totalCustomers'
          }
        ])
      ]);

      reservationStats[filter] = reservationCount;
      salesStats[filter] = salesResult.length > 0 ? salesResult[0].total : 0;
      customerStats[filter] = customerResult.length > 0 ? customerResult[0].totalCustomers : 0;
    }

    // Get latest 5 bookings
    const latestBookings = await reservationModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('facilityName userName date startTime endTime packageName packageFee totalPrice status paymentType paymentStatus datePaid');

    // Respond with summary
    res.status(200).json({
      totalFacilities,
      totalCustomers,
      totalStaff,
      reservations: reservationStats,
      sales: salesStats,
      customers: customerStats, // Add customer stats by time period
      latestBookings
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      message: 'Failed to load dashboard summary',
      error: err.message
    });
  }
};