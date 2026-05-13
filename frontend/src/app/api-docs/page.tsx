'use client';

import { useEffect } from 'react';

const STYLES = `
  body { margin: 0; background: #f8fafc; }
  .swagger-ui .topbar { background: #ffffff; border-bottom: 2px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .swagger-ui .topbar .download-url-wrapper { display: none; }
  .swagger-ui .info .title { color: #0f172a !important; font-weight: 900; }
  .swagger-ui .info { background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .swagger-ui .info .description p { color: #475569; }
  .swagger-ui .scheme-container { background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .swagger-ui { color: #1e293b; background: #f8fafc; }
  .swagger-ui .opblock-tag { color: #334155; border-bottom: 1px solid #e2e8f0; font-weight: 700; }
  .swagger-ui .opblock-tag:hover { background: #f1f5f9; }
  .swagger-ui .opblock { border-radius: 8px; margin-bottom: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .swagger-ui .opblock .opblock-summary { border-radius: 8px; }
  .swagger-ui .opblock.opblock-get { border-color: #bfdbfe; background: #eff6ff; }
  .swagger-ui .opblock.opblock-post { border-color: #bbf7d0; background: #f0fdf4; }
  .swagger-ui .opblock.opblock-put { border-color: #fed7aa; background: #fff7ed; }
  .swagger-ui .opblock.opblock-patch { border-color: #e9d5ff; background: #faf5ff; }
  .swagger-ui .opblock.opblock-delete { border-color: #fecaca; background: #fef2f2; }
  .swagger-ui .btn.authorize { background: #0f172a; color: #ffffff; border: none; font-weight: 700; border-radius: 6px; }
  .swagger-ui .btn.authorize:hover { background: #1e293b; }
  .swagger-ui .btn { border-radius: 6px; }
  .swagger-ui input, .swagger-ui select, .swagger-ui textarea { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; color: #1e293b; }
  .swagger-ui .model-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
  .swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #475569; border-bottom: 1px solid #e2e8f0; }
  .swagger-ui .response-col_status { color: #0f172a; }
  .swagger-ui .markdown p, .swagger-ui .markdown li { color: #475569; }
  .swagger-ui .opblock-description-wrapper p { color: #475569; }
  #swagger-ui { min-height: 100vh; padding: 0 0 40px; }
`;

export default function ApiDocsPage() {
  useEffect(() => {
    // Inject custom styles
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    // Inject Swagger UI CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.type = 'text/css';
    cssLink.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(cssLink);

    // Inject Swagger UI JS bundle then initialise
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
    script.onload = () => {
      const win = window as unknown as {
        SwaggerUIBundle: {
          (config: Record<string, unknown>): void;
          presets: { apis: unknown };
          SwaggerUIStandalonePreset: unknown;
        };
      };

      if (win.SwaggerUIBundle) {
        win.SwaggerUIBundle({
          spec: openApiSpec,
          dom_id: '#swagger-ui',
          presets: [
            win.SwaggerUIBundle.presets.apis,
            win.SwaggerUIBundle.SwaggerUIStandalonePreset,
          ],
          layout: 'BaseLayout',
          deepLinking: true,
          tryItOutEnabled: true,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      styleEl.remove();
      cssLink.remove();
      script.remove();
    };
  }, []);

  return <div id="swagger-ui" />;
}

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Class Booking Management System API',
    description: `
## 🎓 Class Booking Management System

RESTful API for managing training class bookings, users, rooms, and workflows.

### Authentication
All protected endpoints require a **Bearer JWT token** in the Authorization header.

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

### Roles
- **user** — Can create and manage own bookings
- **reviewer** — Reviews submitted bookings
- **approver** — Final approval authority
- **admin** — Full system access
    `,
    version: '4.0.0',
    contact: { name: 'Training Center', email: 'admin@training.vn' },
  },
  servers: [
    { url: 'https://training-web-class-management.vercel.app', description: 'Production (Vercel)' },
    { url: 'http://localhost:3001', description: 'Local Development' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      LoginRequest: {
        type: 'object', required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@training.vn' },
          password: { type: 'string', format: 'password', example: 'Admin@123' },
          remember_me: { type: 'boolean', default: false },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          access_token: { type: 'string' },
          refresh_token: { type: 'string' },
          force_password_change: { type: 'boolean' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          full_name: { type: 'string' },
          role: { type: 'string', enum: ['user', 'reviewer', 'approver', 'admin'] },
          is_active: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          room_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          start_time: { type: 'string', format: 'date-time' },
          end_time: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'] },
          attendees_count: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Room: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          capacity: { type: 'integer' },
          location: { type: 'string' },
          amenities: { type: 'array', items: { type: 'string' } },
          is_active: { type: 'boolean' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication & session management' },
    { name: 'Bookings', description: 'Booking CRUD and workflow actions' },
    { name: 'Rooms', description: 'Room listing and availability' },
    { name: 'Reviewer', description: 'Reviewer queue and actions' },
    { name: 'Approver', description: 'Approver queue and actions' },
    { name: 'Admin', description: 'Admin user and system management' },
    { name: 'Calendar', description: 'Calendar events and blocks' },
  ],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register new user', security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['email', 'password', 'full_name'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, full_name: { type: 'string' } } } } },
        },
        responses: {
          201: { description: 'User created', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login and get tokens', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Invalid credentials' },
          423: { description: 'Account locked' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'], summary: 'Refresh access token', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refresh_token: { type: 'string' } } } } } },
        responses: { 200: { description: 'New access token issued' }, 401: { description: 'Invalid or expired refresh token' } },
      },
    },
    '/api/auth/logout': {
      post: { tags: ['Auth'], summary: 'Logout current session', responses: { 204: { description: 'Logged out' } } },
    },
    '/api/auth/logout-all': {
      post: { tags: ['Auth'], summary: 'Logout all sessions', responses: { 204: { description: 'All sessions revoked' } } },
    },
    '/api/auth/me': {
      get: { tags: ['Auth'], summary: 'Get current user profile', responses: { 200: { description: 'Profile data', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } } },
      patch: { tags: ['Auth'], summary: 'Update profile', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { full_name: { type: 'string' }, phone: { type: 'string' } } } } } }, responses: { 200: { description: 'Updated profile' } } },
    },
    '/api/auth/sessions': {
      get: { tags: ['Auth'], summary: 'List active sessions', responses: { 200: { description: 'Session list' } } },
    },
    '/api/auth/sessions/{id}': {
      delete: { tags: ['Auth'], summary: 'Revoke a session', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Session revoked' } } },
    },
    '/api/auth/activity': {
      get: { tags: ['Auth'], summary: 'Get login activity history', responses: { 200: { description: 'Activity log' } } },
    },
    '/api/auth/change-password': {
      post: { tags: ['Auth'], summary: 'Change password', requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['current_password', 'new_password'], properties: { current_password: { type: 'string' }, new_password: { type: 'string', minLength: 8 } } } } } }, responses: { 200: { description: 'Password changed' }, 400: { description: 'Invalid current password' } } },
    },
    '/api/auth/forgot-password': {
      post: { tags: ['Auth'], summary: 'Request password reset email', security: [], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } } } }, responses: { 200: { description: 'Email sent if account exists' } } },
    },
    '/api/auth/reset-password': {
      post: { tags: ['Auth'], summary: 'Reset password with token', security: [], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['token', 'new_password'], properties: { token: { type: 'string' }, new_password: { type: 'string', minLength: 8 } } } } } }, responses: { 200: { description: 'Password reset successful' }, 400: { description: 'Invalid or expired token' } } },
    },
    '/api/bookings': {
      get: { tags: ['Bookings'], summary: 'List bookings', parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }, { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }], responses: { 200: { description: 'Booking list', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Booking' } }, total: { type: 'integer' } } } } } } } },
      post: { tags: ['Bookings'], summary: 'Create a booking', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['room_id', 'title', 'start_time', 'end_time'], properties: { room_id: { type: 'string', format: 'uuid' }, title: { type: 'string' }, description: { type: 'string' }, start_time: { type: 'string', format: 'date-time' }, end_time: { type: 'string', format: 'date-time' }, attendees_count: { type: 'integer' } } } } } }, responses: { 201: { description: 'Booking created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } }, 409: { description: 'Room conflict' } } },
    },
    '/api/bookings/stats': {
      get: { tags: ['Bookings'], summary: 'Get booking statistics', responses: { 200: { description: 'Stats data' } } },
    },
    '/api/bookings/{id}': {
      get: { tags: ['Bookings'], summary: 'Get booking by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: { description: 'Booking detail', content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } }, 404: { description: 'Not found' } } },
      put: { tags: ['Bookings'], summary: 'Update booking', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Booking' } } } }, responses: { 200: { description: 'Updated' } } },
    },
    '/api/bookings/{id}/submit': {
      patch: { tags: ['Bookings'], summary: 'Submit booking for review', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Status → PENDING_REVIEW' } } },
    },
    '/api/bookings/{id}/cancel': {
      patch: { tags: ['Bookings'], summary: 'Cancel a booking', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Status → CANCELLED' } } },
    },
    '/api/bookings/{id}/approve': {
      patch: { tags: ['Bookings'], summary: 'Approve a booking (Approver only)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Status → APPROVED' } } },
    },
    '/api/bookings/{id}/reject': {
      patch: { tags: ['Bookings'], summary: 'Reject a booking', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } }, responses: { 200: { description: 'Status → REJECTED' } } },
    },
    '/api/bookings/{id}/claim': {
      patch: { tags: ['Bookings'], summary: 'Claim booking for review', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Status → IN_REVIEW' } } },
    },
    '/api/bookings/{id}/unclaim': {
      patch: { tags: ['Bookings'], summary: 'Unclaim booking', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Status → PENDING_REVIEW' } } },
    },
    '/api/bookings/{id}/forward': {
      patch: { tags: ['Bookings'], summary: 'Forward to approver', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Status → PENDING_APPROVAL' } } },
    },
    '/api/bookings/{id}/comments': {
      get: { tags: ['Bookings'], summary: 'List comments on booking', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Comments list' } } },
      post: { tags: ['Bookings'], summary: 'Add comment to booking', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { content: { type: 'string' } } } } } }, responses: { 201: { description: 'Comment added' } } },
    },
    '/api/bookings/{id}/history': {
      get: { tags: ['Bookings'], summary: 'Get booking status history', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'History log' } } },
    },
    '/api/rooms': {
      get: { tags: ['Rooms'], summary: 'List all rooms', parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'capacity', in: 'query', schema: { type: 'integer' } }], responses: { 200: { description: 'Room list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Room' } } } } } } },
    },
    '/api/rooms/availability/all': {
      get: { tags: ['Rooms'], summary: 'Get availability for all rooms', parameters: [{ name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }], responses: { 200: { description: 'Availability data' } } },
    },
    '/api/rooms/{id}': {
      get: { tags: ['Rooms'], summary: 'Get room by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Room detail', content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } } } },
    },
    '/api/rooms/{id}/availability': {
      get: { tags: ['Rooms'], summary: 'Get room availability', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }, { name: 'date', in: 'query', schema: { type: 'string', format: 'date' } }], responses: { 200: { description: 'Timeslot availability' } } },
    },
    '/api/reviewer/queue': {
      get: { tags: ['Reviewer'], summary: 'Get PENDING_REVIEW queue', responses: { 200: { description: 'Pending bookings' } } },
    },
    '/api/reviewer/in-progress': {
      get: { tags: ['Reviewer'], summary: 'Get IN_REVIEW items claimed by me', responses: { 200: { description: 'In-progress bookings' } } },
    },
    '/api/reviewer/history': {
      get: { tags: ['Reviewer'], summary: 'Get reviewed history', responses: { 200: { description: 'Processed items' } } },
    },
    '/api/reviewer/stats': {
      get: { tags: ['Reviewer'], summary: 'Get reviewer KPI stats', responses: { 200: { description: 'KPI data' } } },
    },
    '/api/approver/queue': {
      get: { tags: ['Approver'], summary: 'Get PENDING_APPROVAL queue', responses: { 200: { description: 'Pending approvals' } } },
    },
    '/api/approver/history': {
      get: { tags: ['Approver'], summary: 'Get approval history', responses: { 200: { description: 'Processed items' } } },
    },
    '/api/approver/stats': {
      get: { tags: ['Approver'], summary: 'Get approver KPI stats', responses: { 200: { description: 'KPI data' } } },
    },
    '/api/admin/users': {
      get: { tags: ['Admin'], summary: 'List all users', parameters: [{ name: 'role', in: 'query', schema: { type: 'string' } }, { name: 'is_active', in: 'query', schema: { type: 'boolean' } }, { name: 'search', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'User list' } } },
      post: { tags: ['Admin'], summary: 'Create user', requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, responses: { 201: { description: 'User created' } } },
    },
    '/api/admin/users/{id}': {
      get: { tags: ['Admin'], summary: 'Get user detail', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'User detail' } } },
      patch: { tags: ['Admin'], summary: 'Update user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }, responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Admin'], summary: 'Soft-delete user', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Deleted' } } },
    },
    '/api/admin/users/{id}/unlock': {
      post: { tags: ['Admin'], summary: 'Unlock locked user account', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Account unlocked' } } },
    },
    '/api/admin/stats': {
      get: { tags: ['Admin'], summary: 'Get system statistics', responses: { 200: { description: 'Dashboard stats' } } },
    },
    '/api/admin/rooms': {
      post: { tags: ['Admin'], summary: 'Create a room', requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } }, responses: { 201: { description: 'Room created' } } },
    },
    '/api/admin/rooms/{id}': {
      patch: { tags: ['Admin'], summary: 'Update a room', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Room' } } } }, responses: { 200: { description: 'Updated' } } },
    },
    '/api/admin/audit': {
      get: { tags: ['Admin'], summary: 'Get audit logs', parameters: [{ name: 'from', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } }], responses: { 200: { description: 'Audit entries' } } },
    },
    '/api/admin/config': {
      get: { tags: ['Admin'], summary: 'Get system config', responses: { 200: { description: 'Config object' } } },
      patch: { tags: ['Admin'], summary: 'Update system config', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Updated config' } } },
    },
    '/api/calendar': {
      get: { tags: ['Calendar'], summary: 'Get calendar events', parameters: [{ name: 'start', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'end', in: 'query', schema: { type: 'string', format: 'date' } }], responses: { 200: { description: 'Event list' } } },
    },
    '/api/calendar/availability': {
      get: { tags: ['Calendar'], summary: 'Check availability', parameters: [{ name: 'room_id', in: 'query', schema: { type: 'string' } }, { name: 'start', in: 'query', schema: { type: 'string', format: 'date-time' } }, { name: 'end', in: 'query', schema: { type: 'string', format: 'date-time' } }], responses: { 200: { description: 'Availability result' } } },
    },
    '/api/calendar/export': {
      get: { tags: ['Calendar'], summary: 'Export calendar as iCal', responses: { 200: { description: 'iCal file', content: { 'text/calendar': {} } } } },
    },
    '/api/calendar/admin/blocks': {
      get: { tags: ['Calendar'], summary: 'List admin time blocks', responses: { 200: { description: 'Block list' } } },
      post: { tags: ['Calendar'], summary: 'Create time block', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { room_id: { type: 'string' }, start_time: { type: 'string', format: 'date-time' }, end_time: { type: 'string', format: 'date-time' }, reason: { type: 'string' } } } } } }, responses: { 201: { description: 'Block created' } } },
    },
    '/api/calendar/admin/blocks/{id}': {
      get: { tags: ['Calendar'], summary: 'Get block by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Block detail' } } },
      put: { tags: ['Calendar'], summary: 'Update time block', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'Updated' } } },
      delete: { tags: ['Calendar'], summary: 'Delete time block', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'Deleted' } } },
    },
    '/api/calendar/admin/conflicts': {
      get: { tags: ['Calendar'], summary: 'Get scheduling conflicts', responses: { 200: { description: 'Conflict list' } } },
    },
  },
};
