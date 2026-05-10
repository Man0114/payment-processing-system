import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import connectDB from './config/db.js';
// import paymentRoutes from './routes/payment.routes';
const app = express();
app.use(express.json());
// Routes
// app.use('/api/payments', paymentRoutes);
// Start server
const PORT = process.env.PORT || 3000;
// connectDB().then(() => {
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});
// });
connectDB();
export default app;
//# sourceMappingURL=server.js.map