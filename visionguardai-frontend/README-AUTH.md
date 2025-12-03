# VisionGuard AI Frontend

A modern, AI-powered theft detection and security monitoring system built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Complete Authentication System**: JWT-based auth with role-based access control (OWNER/MANAGER)
- 🏪 **Shop Management**: Create, manage, and assign managers to shops
- 📹 **Live Video Streaming**: WebRTC-powered real-time CCTV feeds
- 🚨 **Anomaly Detection**: Real-time WebSocket alerts for suspicious activities
- 🎨 **Dark/Light Theme**: Beautiful UI with seamless theme switching
- 📊 **Dashboard**: Real-time statistics and monitoring
- 🔒 **Protected Routes**: Secure routing with authentication guards
- 📱 **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Real-time**: WebSocket & WebRTC

## Prerequisites

- Node.js 18+ and npm/yarn
- Running VisionGuard AI Backend (see backend README)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ai-frontend-main
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 4. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ai-frontend-main/
├── app/                      # Next.js app directory
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── shops/               # Shop management pages
│   ├── live-feed/           # Live video streaming
│   └── page.tsx             # Dashboard (home)
├── components/              # Reusable React components
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── ProtectedRoute.tsx   # Auth guard component
│   ├── AnomalyAlerts.tsx    # Real-time alerts
│   └── ...
├── context/                 # React Context providers
│   ├── AuthContext.tsx      # Authentication state
│   └── ThemeContext.tsx     # Theme management
├── hooks/                   # Custom React hooks
│   └── useAnomalyAlerts.ts  # WebSocket alerts hook
├── lib/                     # Utilities and services
│   ├── api/                 # API client setup
│   └── services/            # API service layers
├── types/                   # TypeScript type definitions
└── middleware.ts            # Next.js middleware
```

## Authentication Flow

### Registration (Owner)

1. Navigate to `/register`
2. Fill in name, email, and password
3. Automatically logged in after successful registration

### Login

1. Navigate to `/login`
2. Enter email and password
3. Redirected to dashboard on success

### User Roles

- **OWNER**: Full access to create/manage shops and assign managers
- **MANAGER**: View assigned shops and access their CCTV streams

## Key Features Explained

### Shop Management

Owners can:
- Create new shops with name and address
- Assign managers by email (auto-creates accounts)
- View all owned shops
- Edit and delete shops

Managers can:
- View assigned shops only
- Access CCTV streams for assigned shops

### Live Video Streaming

1. Click "Live Feed" or view stream from a shop
2. Click "Start Stream" to initiate WebRTC connection
3. Camera feed is sent to backend for AI processing
4. Real-time anomaly alerts appear in sidebar

### Anomaly Alerts

- WebSocket connection established on login
- Real-time notifications when suspicious activity detected
- Displays annotated frames with detection details
- Auto-reconnects on connection loss

### Theme System

- Toggle between dark and light modes
- Persisted in localStorage
- Smooth transitions
- Consistent across all pages

## API Integration

The frontend communicates with the backend via:

1. **REST API** (via Axios):
   - Authentication endpoints
   - Shop CRUD operations
   - User management

2. **WebRTC**:
   - Video streaming
   - Peer-to-peer connections with backend

3. **WebSocket**:
   - Real-time anomaly alerts
   - Bidirectional communication

## Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8000` |

## Security Features

- JWT token-based authentication
- Automatic token refresh on API calls
- Protected routes with authentication guards
- Role-based access control
- Secure WebSocket connections
- HTTPS-ready for production

## Troubleshooting

### WebSocket Connection Failed

- Ensure backend is running on correct port
- Check `NEXT_PUBLIC_WS_URL` in `.env.local`
- Verify firewall settings allow WebSocket connections

### Video Stream Not Working

- Grant browser camera permissions
- Check WebRTC configuration
- Ensure backend `/api/offer` endpoint is accessible

### Authentication Issues

- Clear browser localStorage and cookies
- Verify backend is running
- Check `NEXT_PUBLIC_API_URL` configuration

## Production Deployment

### Environment Variables

Update for production:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=wss://your-api-domain.com
```

### Build and Deploy

```bash
npm run build
npm run start
```

Or deploy to Vercel:

```bash
vercel --prod
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: support@visionguard.ai

---

**VisionGuard AI** - Intelligent Security Monitoring System
