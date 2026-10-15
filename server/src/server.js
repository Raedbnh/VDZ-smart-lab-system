const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const machineRoutes = require('./routes/machine.routes');
const bookingRoutes = require('./routes/booking.routes');
const timerRoutes = require('./routes/timer.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'VDZ Smart Lab Server läuft'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/analytics', analyticsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});