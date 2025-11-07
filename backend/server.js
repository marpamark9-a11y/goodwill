import express from "express";
import cors from "cors";
import 'dotenv/config';
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

// ✅ Import Routes
import userRouter from "./routes/userRoute.js";
import adminRouter from "./routes/adminRoute.js";          // ✅ Admin Routes
import facilityRouter from "./routes/facilityRoute.js";    // ✅ Facility Routes
import categoryRouter from "./routes/categoryRoute.js";    // ✅ Category Routes
import reservationRouter from "./routes/reservationRoute.js"; // ✅ Reservation Routes
import staffRouter from "./routes/staffRoute.js";          // ✅ Staff Routes
import paymentRouter from "./routes/paymentRoute.js";      // ✅ Payment Routes


// App Initialization
const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'https://goodwill.caps-hub.com',
    'https://gw-admin.caps-hub.com',
    // Allow localhost for development
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));

// ✅ Connect Database and Cloudinary
connectDB();
connectCloudinary();

// ✅ Middlewares

app.use(express.json()); // Ensures body parsing works for all JSON payloads
// Raw body parser for webhook
app.use('/api/payments/webhook', express.raw({ type: '*/*' }));

// ✅ Routes
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/facility", facilityRouter);     // Facility CRUD APIs
app.use("/api/category", categoryRouter);     // Category CRUD APIs
app.use("/api/reservation", reservationRouter); // Reservation CRUD APIs
app.use("/api/staff", staffRouter);           // Staff Dashboard APIs
// Routes
app.use('/api/payments', paymentRouter);


// ✅ Root Route
app.get("/", (req, res) => {
  res.send("User API is running...");
});

// ✅ Start Server
app.listen(port, () => {
  console.log(`✅ Server started on PORT ${port}`);
});


