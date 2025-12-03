# WebRTC Integration Documentation

## Overview
This document describes the WebRTC integration implemented in the Live Feed page to receive video streams from the backend server.

## Changes Made

### 1. Environment Variables (`.env`)
Updated the environment variables to use Next.js convention (`NEXT_PUBLIC_` prefix for client-side access):
```env
NEXT_PUBLIC_BACKEND="http://localhost:8000"
NEXT_PUBLIC_VIDEO_ID=1
```

### 2. Live Feed Page (`app/live-feed/page.tsx`)

#### State Management
Replaced camera-related state with WebRTC connection state:
- `connectionStatus`: Tracks WebRTC connection state (disconnected, connecting, connected, failed)
- `statsInfo`: Displays real-time WebRTC statistics
- `pcRef`: Reference to RTCPeerConnection
- `sessionIdRef`: Stores backend session ID
- `statsIntervalRef`: Reference to stats monitoring interval

#### Core Functions

##### `startWebRTC()`
- Reads backend URL and video ID from environment variables
- Creates RTCPeerConnection with Google STUN servers
- Adds video transceiver with `recvonly` direction (receive only, no sending)
- Creates WebRTC offer and sends it to backend `/api/offer` endpoint
- Receives SDP answer from backend and sets remote description
- Stores session ID for later use
- Starts stats monitoring

##### `stopWebRTC()`
- Stops stats monitoring
- Sends disconnect request to backend `/api/session/{session_id}`
- Closes RTCPeerConnection
- Clears video element
- Resets all state

##### `reconnectWebRTC()`
- Stops existing connection and starts a new one

##### `startStatsMonitoring()`
- Monitors WebRTC stats every second
- Displays frames decoded and jitter metrics

#### UI Changes
- **Connect Button**: Initiates WebRTC connection to backend
- **Disconnect Button**: Closes WebRTC connection
- **Reconnect Button**: Appears when connection fails/disconnects
- **Connection Status**: Shows current connection state
- **Stats Display**: Shows real-time WebRTC statistics (frames, jitter)
- **Info Cards**: Updated to show WebRTC protocol and receive-only mode

## Backend API Endpoints

The frontend expects the following backend endpoints:

### POST `/api/offer`
**Request:**
```json
{
  "sdp": "...",
  "type": "offer",
  "video_id": 1
}
```

**Response:**
```json
{
  "sdp": "...",
  "type": "answer",
  "session_id": "unique-session-id"
}
```

### POST `/api/session/{session_id}`
Used to disconnect/cleanup the session on the backend.

## How It Works

1. User clicks "Connect to Stream" button
2. Frontend creates RTCPeerConnection with recvonly transceiver
3. Frontend generates SDP offer and sends it to backend
4. Backend processes offer and returns SDP answer with session_id
5. Frontend sets remote description with the answer
6. WebRTC negotiation completes and video track is received
7. Video stream is displayed in the video element
8. Stats are monitored and displayed every second
9. On disconnect, session is cleaned up on backend

## Configuration

All configuration is read from environment variables:
- `NEXT_PUBLIC_BACKEND`: Backend server URL (default: http://localhost:8000)
- `NEXT_PUBLIC_VIDEO_ID`: Video source ID to request (default: 1)

## Key Features

✅ **Receive-only mode**: Client only receives video, doesn't send any data
✅ **Environment-based config**: Backend URL and video ID from .env
✅ **Real-time stats**: Displays WebRTC metrics
✅ **Auto-reconnect**: Button appears on connection failure
✅ **Session management**: Properly cleans up backend sessions
✅ **Error handling**: User-friendly error messages
✅ **Connection state tracking**: Visual feedback of connection status

## Testing

To test the integration:
1. Ensure backend is running at `http://localhost:8000`
2. Ensure backend has WebRTC offer endpoint at `/api/offer`
3. Start the Next.js development server: `npm run dev`
4. Navigate to `/live-feed` page
5. Click "Connect to Stream"
6. Video should appear once connection is established

## Notes

- The client uses Google's STUN servers for NAT traversal
- No TURN servers are configured (may need for restrictive networks)
- Stats monitoring runs every 1 second
- Session cleanup is performed on unmount and disconnect
