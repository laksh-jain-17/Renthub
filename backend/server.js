const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/renthub')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('DB Connection Error:', err));

const authRoutes  = require('./routes/authRoutes');
const userRoutes  = require('./routes/userRoutes');
const itemRoutes  = require('./routes/itemRoutes');
//const bookingRoutes = require('./routes/bookingRoutes');//
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/items',    itemRoutes);
//app.use('/api/bookings', bookingRoutes);//
app.use('/api/admin',    adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
