# MapIT

A mapping application for MIT campus.

## Environment Setup

Before running the application, you need to set up your environment variables:

1. Copy the `env.example` file to `.env`:
   ```
   cp env.example .env
   ```

2. Update the `.env` file with your values:
   - `VITE_MAPBOX_TOKEN`: Your Mapbox access token
   - `VITE_MAPBOX_STYLE_URL`: Your Mapbox style URL 
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth client ID for client-side
   - `GOOGLE_CLIENT_ID`: Same Google OAuth client ID for server-side
   - `MONGO_SRV`: Your MongoDB connection string
   - `SESSION_SECRET`: A strong random string for session encryption
   - `FIREROAD_API_BASE_URL`: The FireRoad API base URL
   - `PORT`: (Optional) The port to run the server on, defaults to 3000

## Development

To run the application in development mode:

```
npm install
npm run dev
```

In another terminal window:
```
npm start
```

## Deployment

### Using deploy script

The easiest way to deploy is using the deploy script:

```
./deploy.sh
```

This will:
1. Check if your `.env` file exists
2. Install dependencies
3. Build the client application
4. Provide instructions to start the server

To build and automatically start the server:

```
./deploy.sh production
```

### Manual deployment

Alternatively, you can run the deployment steps manually:

1. Install dependencies:
   ```
   npm install
   ```

2. Build the client-side application:
   ```
   npm run build
   ```

3. Start the server in production mode:
   ```
   npm run start:prod
   ```

## Technology Stack

- Frontend: React, Vite, Mapbox GL
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: Google OAuth
