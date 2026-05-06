if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
}
const express = require('express');
const morgan  = require('morgan');
const { requireAuth } = require('../../shared/middleware/auth');

const bookingRoutes  = require('./routes/bookings');
const roomRoutes     = require('./routes/rooms');
const adminRoutes    = require('./routes/admin');
const calendarRoutes = require('./routes/calendar');
const reviewerRoutes = require('./routes/reviewer');
const approverRoutes = require('./routes/approver');

const app  = express();
const PORT = process.env.BOOKING_SERVICE_PORT || 8012;

app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'booking-service' }));

// Apply auth middleware to all booking routes
app.use('/api/bookings',  requireAuth, bookingRoutes);
app.use('/api/rooms',     requireAuth, roomRoutes);
app.use('/api/admin',     requireAuth, adminRoutes);
app.use('/api/calendar',  requireAuth, calendarRoutes);
app.use('/api/reviewer',  requireAuth, reviewerRoutes);   // SRS 19.6
app.use('/api/approver',  requireAuth, approverRoutes);   // SRS 20.6


app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`📅 Booking Service on port ${PORT}`));
}

module.exports = app;
