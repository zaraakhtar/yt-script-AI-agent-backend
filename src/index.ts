// src/index.ts

import dotenv from 'dotenv';
// Load environment variables FIRST
dotenv.config();

import express from 'express';
import cors from 'cors';
import { generateRouter } from './routes/generate.js';


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-expo-app.com'] // Replace with your Expo app URL in production
    : ['http://localhost:19006', 'exp://192.168.1.100:19000'] // Local development
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0' 
  });
});

app.use('/api', generateRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;