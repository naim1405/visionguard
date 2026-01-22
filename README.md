# VisionGuard.ai 🛡️

<div align="center">

**An AI-powered theft detection and security monitoring system with real-time video processing**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.121.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue?style=flat-square&logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)

---

## 🎯 Overview

VisionGuard.ai is a comprehensive security monitoring solution that combines cutting-edge AI technology with real-time video processing to detect suspicious activities and potential theft. The system features a modern web interface for monitoring multiple camera feeds, reviewing alerts, and managing security across multiple shop locations.

### Key Capabilities

- **Real-time AI Detection**: Process video feeds in real-time using advanced AI models for anomaly detection
- **WebRTC Streaming**: Low-latency video streaming directly to web browsers
- **Multi-shop Management**: Support for multiple locations with role-based access control
- **Telegram Integration**: Instant notifications and remote monitoring via Telegram bot
- **Persistent WebSocket Connections**: Real-time alerts with automatic reconnection and heartbeat monitoring
- **Authentication & Authorization**: Secure JWT-based authentication with owner and manager roles

---

## ✨ Features

### Frontend Features
- 📊 **Real-time Dashboard** - Monitor system metrics, active cameras, and detection accuracy
- 📹 **Live Feed** - WebRTC camera streaming with AI processing
- 🚨 **Suspicious Activity** - Review, filter, and manage detected security events
- 🏪 **Shop Management** - Multi-location support with shop-specific configurations
- 🔔 **Real-time Notifications** - Instant alerts via WebSocket connections
- 🎨 **Modern UI** - Dark/light theme with gradient accents and smooth animations
- 📱 **Responsive Design** - Seamless experience across desktop, tablet, and mobile
- 🔐 **Secure Authentication** - JWT-based auth with role-based access control

### Backend Features
- ✅ **AI Video Processing** - Real-time frame processing with configurable AI models
- ✅ **WebRTC Signaling** - SDP offer/answer exchange for peer connections
- ✅ **WebSocket Support** - Persistent connections for real-time notifications
- ✅ **Telegram Bot** - Bi-directional communication and remote control
- ✅ **Database Management** - PostgreSQL with Alembic migrations
- ✅ **RESTful API** - OpenAPI 3.0 compliant endpoints
- ✅ **CORS Support** - Configurable cross-origin resource sharing
- ✅ **Health Monitoring** - Connection tracking and health check endpoints
- ✅ **Training Data Collection** - Reinforcement learning data storage

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VisionGuard.ai System                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐                                 ┌──────────────────┐
│  Next.js Client  │                                 │  FastAPI Backend │
│    (Frontend)    │                                 │    (Python)      │
│                  │         WebRTC Video            │                  │
│  ┌────────────┐  │◄────────(Encrypted)────────────┤  ┌────────────┐  │
│  │  Live Feed │  │                                 │  │  Signaling │  │
│  │   (WebRTC) │  │                                 │  │   Router   │  │
│  └────────────┘  │         WebSocket               │  └────────────┘  │
│                  │◄──────(Notifications)───────────┤                  │
│  ┌────────────┐  │                                 │  ┌────────────┐  │
│  │ Dashboard  │  │         REST API                │  │ AI Stream  │  │
│  │  & Alerts  │  │◄──────(JSON Data)──────────────┤  │   Track    │  │
│  └────────────┘  │                                 │  └──────┬─────┘  │
│                  │                                 │         │        │
│  ┌────────────┐  │                                 │  ┌──────▼─────┐  │
│  │   Auth &   │  │                                 │  │    AI      │  │
│  │   Shops    │  │                                 │  │ Processor  │  │
│  └────────────┘  │                                 │  └──────┬─────┘  │
└──────────────────┘                                 │         │        │
                                                     │  ┌──────▼─────┐  │
┌──────────────────┐                                 │  │ PostgreSQL │  │
│  Telegram Bot    │◄────────(Polling)───────────────┤  │  Database  │  │
│  (Notifications) │                                 │  └────────────┘  │
└──────────────────┘                                 └──────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **AI Models**: TensorFlow.js with COCO-SSD
- **HTTP Client**: Axios
- **State Management**: React Context API

### Backend
- **Framework**: FastAPI 0.121.0
- **Language**: Python 3.8+
- **WebRTC**: aiortc 1.14.0
- **Video Processing**: OpenCV, PyAV
- **AI/ML**: TensorFlow 2.x, Keras
- **Database**: PostgreSQL with Alembic migrations
- **Authentication**: JWT (PyJWT)
- **Real-time**: WebSockets
- **Telegram**: python-telegram-bot
- **CORS**: FastAPI CORS middleware

---

## 📦 Prerequisites

### System Requirements
- **Node.js**: 18+ 
- **Python**: 3.8 or higher
- **PostgreSQL**: 13+
- **FFmpeg**: Required for video processing
- **Git**: For version control

### Optional
- **Telegram Bot Token**: For notification features
- **CUDA**: For GPU-accelerated AI processing (optional)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd visionguard
```

### 2. Setup Backend & Frontend

For detailed installation instructions:

- **Backend Setup**: See [backend-visionguard-ai/README.md](backend-visionguard-ai/README.md#-installation)
- **Frontend Setup**: See [visionguardai-frontend/README.md](visionguardai-frontend/README.md#installation)

---

## ⚙️ Configuration

For detailed configuration instructions:

- **Backend Configuration**: See [backend-visionguard-ai/README.md](backend-visionguard-ai/README.md#-configuration) for environment variables, database setup, and Telegram bot configuration
- **Frontend Configuration**: See [visionguardai-frontend/README.md](visionguardai-frontend/README.md) for Next.js environment setup

---

## 🏃‍♂️ Running the Application

### Quick Start

**Backend**: `cd backend-visionguard-ai && python main.py` → [http://localhost:8000](http://localhost:8000)  
**Frontend**: `cd visionguardai-frontend && npm run dev` → [http://localhost:3000](http://localhost:3000)

For detailed instructions including Telegram bot setup and production deployment:

- **Backend**: See [backend-visionguard-ai/README.md](backend-visionguard-ai/README.md#-running-the-application)
- **Frontend**: See [visionguardai-frontend/README.md](visionguardai-frontend/README.md#getting-started)

---

## 📁 Project Structure

```
visionguard/
├── backend-visionguard-ai/         # Python FastAPI Backend
│   ├── app/                        # Application code
│   │   ├── ai/                     # AI models and processors
│   │   ├── api/                    # API endpoints
│   │   ├── core/                   # Core utilities
│   │   ├── db/                     # Database configuration
│   │   ├── models/                 # SQLAlchemy models
│   │   └── schemas/                # Pydantic schemas
│   ├── docs/                       # Backend documentation
│   ├── main.py                     # Application entry point
│   └── README.md                   # Backend documentation
│
├── visionguardai-frontend/         # Next.js Frontend
│   ├── app/                        # Next.js app directory
│   ├── components/                 # React components
│   ├── context/                    # React contexts
│   ├── hooks/                      # Custom hooks
│   ├── lib/                        # API and services
│   └── README.md                   # Frontend documentation
│
└── README.md                       # This file
```

For detailed project structure:
- [Backend Structure](backend-visionguard-ai/README.md#-project-structure)
- [Frontend Structure](visionguardai-frontend/README.md#project-structure)

---

## 📚 API Documentation

Once the backend is running, visit:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

For detailed API endpoint documentation, see:
- [Backend API Documentation](backend-visionguard-ai/README.md#-api-documentation)
- [API Documentation (docs/)](backend-visionguard-ai/docs/API_DOCUMENTATION.md)

---

## 🔐 Authentication & Authorization

VisionGuard uses JWT-based authentication with role-based access control:

### Roles
- **OWNER**: Full access to all features, can manage shops and users
- **MANAGER**: Limited access to shop management and monitoring

### Token Flow
1. User logs in with credentials
2. Server returns access token (30 min) and refresh token
3. Access token is sent with each API request
4. Refresh token is used to get new access token when expired

---

## 🔔 Real-time Features

### WebSocket Notifications
- Persistent connection with exponential backoff reconnection
- Heartbeat mechanism (30s ping/pong)
- Automatic stale connection cleanup
- Real-time anomaly alerts

### WebRTC Video Streaming
- Low-latency peer-to-peer video streaming
- STUN server configuration for NAT traversal
- Automatic connection management
- Frame-by-frame AI processing

---

## 📱 Telegram Integration

The system includes a Telegram bot for remote monitoring:

- Receive instant alerts for detected anomalies
- View camera snapshots
- Check system status
- Remote shop management

---

## 🧪 Testing

For testing instructions, see:
- [Backend Testing](backend-visionguard-ai/README.md#-testing)
- [Frontend Testing](visionguardai-frontend/README.md)

---

## 📖 Additional Documentation

For more detailed information, see:

- [Backend Documentation](backend-visionguard-ai/README.md)
- [Frontend Documentation](visionguardai-frontend/README.md)
- [API Documentation](backend-visionguard-ai/docs/API_DOCUMENTATION.md)
- [Authentication Setup](backend-visionguard-ai/docs/AUTH_SETUP.md)
- [WebSocket Architecture](backend-visionguard-ai/docs/WEBSOCKET_PERSISTENT_CONNECTION.md)
- [WebRTC Architecture](backend-visionguard-ai/docs/WEBRTC_WEBSOCKET_ARCHITECTURE.md)
- [Environment Setup](backend-visionguard-ai/docs/ENVIRONMENT_SETUP.md)
- [How to Run](backend-visionguard-ai/docs/HOW_TO_RUN.md)
