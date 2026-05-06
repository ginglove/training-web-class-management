/** @type {import('next').NextConfig} */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    // On Vercel (Production), the routing is handled by vercel.json.
    // We only need these rewrites for local development.
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    return [
      {
        source: '/api/auth/:path*',
        destination: `http://localhost:${process.env.AUTH_SERVICE_PORT || 8011}/api/auth/:path*`
      },
      {
        source: '/api/bookings/:path*',
        destination: `http://localhost:${process.env.BOOKING_SERVICE_PORT || 8012}/api/bookings/:path*`
      },
      {
        source: '/api/rooms/:path*',
        destination: `http://localhost:${process.env.BOOKING_SERVICE_PORT || 8012}/api/rooms/:path*`
      },
      {
        source: '/api/admin/:path*',
        destination: `http://localhost:${process.env.BOOKING_SERVICE_PORT || 8012}/api/admin/:path*`
      },
      {
        source: '/api/calendar/:path*',
        destination: `http://localhost:${process.env.BOOKING_SERVICE_PORT || 8012}/api/calendar/:path*`
      },
      {
        source: '/api/notifications/:path*',
        destination: `http://localhost:${process.env.NOTIF_SERVICE_PORT || 8013}/api/notifications/:path*`
      },
      {
        source: '/api/reviewer/:path*',
        destination: `http://localhost:${process.env.BOOKING_SERVICE_PORT || 8012}/api/reviewer/:path*`
      },
      {
        source: '/api/approver/:path*',
        destination: `http://localhost:${process.env.BOOKING_SERVICE_PORT || 8012}/api/approver/:path*`
      }
    ];
  }
};

module.exports = nextConfig;
