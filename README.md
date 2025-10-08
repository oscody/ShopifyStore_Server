# Shopify Storefront - Backend

Express.js API server for the Shopify Storefront application.

## Development

1. Install dependencies:

```bash
npm install
```

2. Update the `.env` file with your configuration:

   - `DATABASE_URL`: Your database connection string
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
   - `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:5173)
   - `PORT`: Server port (default: 5000)
   - `SESSION_SECRET`: Session secret for authentication

3. Start the development server:

```bash
npm run dev
```

## Running in Production

```bash
npm start
```

## Database

The application uses PostgreSQL with Drizzle ORM. Make sure your `DATABASE_URL` points to a PostgreSQL database.

To push schema changes:

```bash
npm run db:push
```

## Database Seeding

To seed the database with sample data:

```bash
npm run db:seed
```

This will:

- Clear existing data
- Add sample categories (Electronics, Clothing, Home & Garden, Sports)
- Add sample products with images and inventory data

## Health Check Endpoints

The server provides two health check endpoints:

### Simple Health Check

- **URL**: `GET /health`
- **Purpose**: Basic health check for load balancers and monitoring
- **Response**: `200 OK` with simple status

### Detailed Health Check

- **URL**: `GET /api/health`
- **Purpose**: Comprehensive health check with service status
- **Response**: Detailed JSON with:
  - Overall status (healthy/unhealthy)
  - Timestamp and uptime
  - Environment information
  - Service status (database, Stripe)
  - Version information

Example response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "stripe": "configured"
  }
}
```
