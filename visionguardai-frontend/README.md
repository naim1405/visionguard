# VisionGuard.ai

A modern, AI-powered theft detection and security monitoring system built with Next.js.

## Features

- 📊 **Real-time Dashboard** - Monitor system status, active cameras, and detection accuracy
- 📹 **Live Feed** - WebRTC camera feed with AI streaming capabilities
- 🚨 **Suspicious Activity** - Review and manage detected security events
- 🎨 **Modern UI** - Dark theme with gradient accents and smooth animations
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository or navigate to the project directory:

```bash
cd visionguard
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
visionguard/
├── app/
│   ├── api/
│   │   └── stream/          # API endpoint for video streaming
│   ├── live-feed/           # Live camera feed page
│   ├── suspicious-activity/ # Activity monitoring page
│   ├── layout.tsx           # Root layout with sidebar
│   ├── page.tsx             # Dashboard page
│   └── globals.css          # Global styles
├── components/
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── StatCard.tsx         # Statistics card component
│   └── Chart.tsx            # Chart component
├── lib/
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
```

## Features Overview

### Dashboard

- System statistics and metrics
- Anomaly detection trends (line chart)
- Real-time system status indicators
- Recent alerts table

### Live Feed

- WebRTC camera access
- Real-time video streaming
- Frame capture and transmission to backend
- Camera permission handling

### Suspicious Activity

- Filterable activity list
- Severity indicators (high/medium/low)
- Status tracking (pending/verified/dismissed)
- Detailed activity modal view

## API Endpoints

### POST /api/stream

Receives video frames from the live feed for AI processing.

**Request Body:**

```json
{
  "frame": "base64_encoded_image",
  "timestamp": "2024-11-04T12:00:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Frame received",
  "timestamp": "2024-11-04T12:00:00.000Z",
  "detections": []
}
```

## Customization

### Theme Colors

Edit `tailwind.config.ts` to customize the color scheme.

### Mock Data

Replace mock data in page components with actual API calls to your backend.

### Camera Settings

Adjust video constraints in `app/live-feed/page.tsx`:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
})
```

## Building for Production

```bash
npm run build
npm start
```

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue in the repository.

---

Built with ❤️ using Next.js and Tailwind CSS
