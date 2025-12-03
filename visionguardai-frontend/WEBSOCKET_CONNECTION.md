# WebSocket Persistent Connection

## Overview

The VisionGuard AI frontend maintains a persistent WebSocket connection to receive real-time anomaly alerts from the backend.

## Connection URL

```
ws://localhost:8000/ws/alerts/{user_id}?token={JWT_TOKEN}
```

## Usage

### Using the Hook

```tsx
import { useAnomalyAlerts } from '@/hooks/useAnomalyAlerts'

function MyComponent() {
  const { alerts, connected, clearAlerts, removeAlert } = useAnomalyAlerts()
  
  return (
    <div>
      {/* Connection status */}
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      
      {/* Display alerts */}
      {alerts.map(alert => (
        <div key={alert.id}>
          <p>Person #{alert.person_id}</p>
          <p>Status: {alert.details.status}</p>
          {alert.frame && (
            <img src={`data:image/jpeg;base64,${alert.frame}`} />
          )}
          <button onClick={() => removeAlert(alert.id)}>Dismiss</button>
        </div>
      ))}
      
      {/* Clear all alerts */}
      <button onClick={clearAlerts}>Clear All</button>
    </div>
  )
}
```

## Features

### Automatic Reconnection
- Exponential backoff (1s → 30s max)
- Automatic retry on connection loss
- Prevents reconnection loops

### Heartbeat Monitoring
- Sends ping every 30 seconds
- Expects pong within 60 seconds
- Auto-disconnect and reconnect if no response

### Alert Management
- Stores last 50 alerts
- Real-time alert notifications
- Acknowledgment sent to backend

## Message Types

### Outgoing (Client → Server)
- `ping` - Heartbeat check
- `pong` - Response to server ping
- `ack` - Acknowledge alert received

### Incoming (Server → Client)
- `ping` - Server heartbeat check
- `pong` - Server heartbeat response
- `anomaly_detected` - Anomaly alert with frame data

## Alert Structure

```typescript
interface AnomalyAlert {
  id: number
  stream_id: string
  person_id: number
  timestamp: string
  frame?: string  // Base64 encoded JPEG
  details: {
    status: string
    confidence?: number
  }
}
```

## Configuration

Update `.env.local`:

```bash
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Troubleshooting

### Not Connecting
1. Check backend is running
2. Verify JWT token is valid
3. Check user is authenticated
4. Review browser console for errors

### Connection Drops
1. Check network connectivity
2. Verify backend WebSocket endpoint is accessible
3. Check for firewall/proxy blocking WebSocket

### No Alerts Received
1. Verify WebSocket is connected
2. Check backend is sending alerts
3. Ensure video stream is active
4. Review backend logs for errors

## Development

### Test Connection

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:8000/ws/alerts/{user_id}?token={token}"

# Send ping
> {"type":"ping","timestamp":"2024-12-03T10:30:00"}

# Expect pong response
< {"type":"pong","timestamp":"2024-12-03T10:30:01"}
```

## Implementation Details

See `hooks/useAnomalyAlerts.ts` for full implementation.

Key features:
- React hooks for state management
- Automatic cleanup on unmount
- Exponential backoff reconnection
- Heartbeat monitoring
- Connection health tracking
