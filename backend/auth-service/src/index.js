if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
}
const express = require('express');
const morgan  = require('morgan');
const authRoutes = require('./routes/auth');

const app  = express();
const PORT = process.env.AUTH_SERVICE_PORT || 8011;

app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'auth-service' }));
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🔐 Auth Service on port ${PORT}`));
}

module.exports = app;
