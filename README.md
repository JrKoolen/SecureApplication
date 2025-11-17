# Secure Application

Enterprise-grade secure web application with comprehensive security features including authentication, 2FA, admin panel, and more.

## Features

- Secure authentication with bcrypt password hashing
- Two-factor authentication (2FA) support
- User management with role-based access control
- Admin panel for user management
- Rate limiting and security features
- Geolocation-based login tracking
- Account locking mechanisms
- Password history tracking

## Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- Git

## Quick Start

### Option 1: Clone and Setup (New Machine)

```bash
# Clone the repository
git clone https://github.com/JrKoolen/SecureApplication.git
cd SecureApplication

# Run setup script (installs dependencies and starts containers)
# Windows:
setup.bat

# Linux/Mac/WSL:
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/JrKoolen/SecureApplication.git
cd SecureApplication

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start containers
docker-compose up -d --build
```

## Updating After Code Changes

After pulling updates or making changes:

```bash
# Windows:
update.bat

# Linux/Mac/WSL:
./update.sh
```

Or manually:
```bash
npm run build
docker-compose up -d --build
```

## Access

- **Application**: http://localhost:3000
- **Admin Email**: admin@secureapp.com
- **Admin Password**: Admin@123!Secure

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: MySQL 8.0 (via Docker)
- **Cache/Sessions**: Redis 7 (via Docker)
- **ORM**: Sequelize
- **Authentication**: JWT, bcrypt, speakeasy (2FA)
- **Frontend**: Vanilla JavaScript, HTML, CSS

## Docker Services

- `app`: Main application server
- `mysql`: MySQL 8.0 database
- `redis`: Redis cache and session store

## Configuration

Environment variables are set in `docker-compose.yml`. For production, create a `.env` file:

```env
DB_HOST=mysql
DB_PORT=3306
DB_NAME=secure_app
DB_USER=secure_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# Rebuild containers
docker-compose up -d --build

# Access MySQL
docker-compose exec mysql mysql -u secure_user -p secure_app

# Access Redis CLI
docker-compose exec redis redis-cli
```

## Project Structure

```
├── src/
│   ├── config/          # Database configuration
│   ├── middleware/      # Authentication middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── public/              # Frontend files
├── dist/                # Compiled TypeScript (generated)
├── docker-compose.yml    # Docker services configuration
├── Dockerfile           # Application container definition
├── setup.bat/sh          # Initial setup script
└── update.bat/sh         # Update script
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Two-factor authentication (TOTP)
- Rate limiting on login attempts
- Account locking after failed attempts
- Geolocation-based suspicious login detection X
- Password complexity requirements
- Password history tracking (prevents reuse) X
- Session management with Redis
- Security headers via Helmet X

