# Geotechnical Laboratory Management System

## Overview

This is a comprehensive geotechnical laboratory management system built with React/TypeScript frontend and Express.js backend. The system specializes in soil density testing (in-situ, real density, and max/min density tests) following Brazilian technical standards (NBR). It features a modern web interface with real-time data synchronization, PDF report generation, and equipment management capabilities.

## System Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Tailwind CSS** with Shadcn/UI components for modern, accessible interface
- **Wouter** for client-side routing
- **React Query** for server state management and caching
- **React PDF** for professional report generation
- **Vite** as the build tool with hot module replacement

### Backend Stack
- **Express.js** with TypeScript for API server
- **Drizzle ORM** with PostgreSQL for structured data storage
- **Firebase Authentication** for user management
- **Neon Database** for managed PostgreSQL hosting
- **Session management** with PostgreSQL-based storage

### Authentication Strategy
The system implements a hybrid authentication approach:
- **Firebase Authentication** for user login/logout and token verification
- **PostgreSQL user management** for role-based permissions and organization data
- **Session storage** for maintaining authentication state

## Key Components

### Laboratory Test Modules
1. **Density In-Situ Testing** (NBR 9813:2016)
   - Sand cone method implementation
   - Moisture content calculations
   - Automatic density and compaction calculations
   
2. **Real Density Testing** (NBR 6508:1984)
   - Pycnometer method for grain density
   - Temperature correction factors
   
3. **Max/Min Density Testing** (NBR 12004:1990)
   - Maximum and minimum void index calculations
   - Relative compactness determination

### Equipment Management
- Equipment catalog with calibration tracking
- Category-based organization
- Measurement precision control

### PDF Report Generation
- Professional laboratory report layouts
- Automated calculations with validation
- Standard-compliant formatting
- Vertical table layouts for space optimization

## Data Flow

### Triple Data Synchronization
The system implements a three-tier data synchronization strategy:

1. **IndexedDB (Local)**: Offline-first approach with local caching
2. **PostgreSQL (Backend)**: Structured relational data with complex queries
3. **Firebase Firestore**: Real-time synchronization across devices

### Data Storage Pattern
```
User Input → Local Storage → API Validation → PostgreSQL → Firestore Sync
```

### Calculation Service Architecture
- Modular calculation services separated by test type
- Input validation and range checking
- Error handling for edge cases (division by zero, invalid ranges)
- Automated precision control based on measurement standards

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **firebase**: Authentication and real-time sync
- **drizzle-orm**: Type-safe database queries
- **@radix-ui**: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **@react-pdf/renderer**: PDF generation

### Development Tools
- **TypeScript**: Type safety across the stack
- **Vite**: Fast development build tool
- **Tailwind CSS**: Utility-first styling
- **ESLint**: Code quality and accessibility rules
- **Jest**: Testing framework with accessibility testing

### Payment Integration
- **Stripe**: Subscription management (configured but not fully implemented)
- **Mercado Pago**: Brazilian payment processing

## Deployment Strategy

### Build Process
- **Vite build** for frontend optimization
- **esbuild** for backend bundling
- **Firebase Hosting** for frontend deployment
- **Replit** for development and testing environment

### Database Management
- **Drizzle migrations** for schema changes
- **Neon Database** for production PostgreSQL
- **Connection pooling** for scalability

### Environment Configuration
- Development: Replit with local PostgreSQL
- Production: Firebase Hosting + Neon Database
- Authentication: Firebase project with custom claims

## Changelog
- June 13, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.