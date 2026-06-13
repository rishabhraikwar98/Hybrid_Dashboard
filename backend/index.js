import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/products.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';

dotenv.config();
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL, // for production
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use('/api/products', productRoutes);

app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.error(err));