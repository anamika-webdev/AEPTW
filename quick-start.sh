#!/bin/bash

# EPTW Full Stack - Quick Start Script
# This script helps you get the application running quickly

echo "=========================================="
echo "Amazon EPTW - Quick Start"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_info() {
    echo -e "${NC}ℹ${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js $NODE_VERSION found"
else
    print_error "Node.js not found. Please install Node.js v14 or higher."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm $NPM_VERSION found"
else
    print_error "npm not found. Please install npm."
    exit 1
fi

# Check MySQL
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    print_success "MySQL found"
else
    print_warning "MySQL not found. You'll need to install and configure MySQL."
fi

echo ""
echo "=========================================="
echo "Installation Options"
echo "=========================================="
echo ""
echo "1. Quick Start (recommended for development)"
echo "2. Docker Setup (recommended for testing/production)"
echo "3. Manual Setup"
echo "4. Exit"
echo ""
read -p "Choose an option (1-4): " OPTION

case $OPTION in
    1)
        echo ""
        echo "=========================================="
        echo "Quick Start - Development Mode"
        echo "=========================================="
        echo ""
        
        # Install dependencies
        print_info "Installing dependencies..."
        npm run install:all
        
        if [ $? -eq 0 ]; then
            print_success "Dependencies installed"
        else
            print_error "Failed to install dependencies"
            exit 1
        fi
        
        echo ""
        print_info "Setting up environment files..."
        
        # Setup backend .env
        if [ ! -f backend/.env ]; then
            cp backend/.env.example backend/.env
            print_success "Created backend/.env"
            print_warning "Please edit backend/.env with your database credentials"
        else
            print_info "backend/.env already exists"
        fi
        
        # Setup frontend .env
        if [ ! -f frontend/.env ]; then
            cp frontend/.env.example frontend/.env
            print_success "Created frontend/.env"
        else
            print_info "frontend/.env already exists"
        fi
        
        echo ""
        print_warning "Database Setup Required:"
        echo "  1. Ensure MySQL is running"
        echo "  2. Run: mysql -u root -p < database/amazon_eptw_db.sql"
        echo ""
        
        read -p "Have you set up the database? (y/n): " DB_SETUP
        
        if [ "$DB_SETUP" = "y" ] || [ "$DB_SETUP" = "Y" ]; then
            echo ""
            print_info "Starting application..."
            echo ""
            print_success "Backend will start on: http://localhost:3000"
            print_success "Frontend will start on: http://localhost:5173"
            echo ""
            print_info "Press Ctrl+C to stop the servers"
            echo ""
            npm start
        else
            echo ""
            print_warning "Please set up the database first:"
            echo "  mysql -u root -p < database/amazon_eptw_db.sql"
            echo ""
            echo "Then run: npm start"
        fi
        ;;
        
    2)
        echo ""
        echo "=========================================="
        echo "Docker Setup"
        echo "=========================================="
        echo ""
        
        # Check Docker
        if ! command -v docker &> /dev/null; then
            print_error "Docker not found. Please install Docker first."
            echo "Download from: https://www.docker.com/get-started"
            exit 1
        fi
        
        # Check Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            print_error "Docker Compose not found. Please install Docker Compose first."
            exit 1
        fi
        
        print_success "Docker found"
        print_success "Docker Compose found"
        echo ""
        
        # Create .env for docker-compose
        if [ ! -f .env ]; then
            cat > .env << EOF
# Database Configuration
DB_USER=eptw_user
DB_PASSWORD=eptw_password_change_me
DB_NAME=amazon_eptw_db
DB_PORT=3306

# Backend Configuration
PORT=3000
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRE=7d
SESSION_SECRET=$(openssl rand -hex 32)

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:3000/api

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EOF
            print_success "Created .env file"
            print_warning "Please review and update .env with your settings"
        else
            print_info ".env file already exists"
        fi
        
        echo ""
        print_info "Building and starting Docker containers..."
        echo ""
        
        docker-compose up -d --build
        
        if [ $? -eq 0 ]; then
            echo ""
            print_success "Docker containers are running!"
            echo ""
            echo "Services:"
            echo "  Frontend: http://localhost:5173"
            echo "  Backend:  http://localhost:3000"
            echo "  MySQL:    localhost:3306"
            echo ""
            echo "View logs: docker-compose logs -f"
            echo "Stop:      docker-compose down"
        else
            print_error "Failed to start Docker containers"
            exit 1
        fi
        ;;
        
    3)
        echo ""
        echo "=========================================="
        echo "Manual Setup"
        echo "=========================================="
        echo ""
        echo "Please follow the detailed setup guide:"
        echo "  docs/SETUP.md"
        echo ""
        echo "Quick steps:"
        echo "  1. npm run install:all"
        echo "  2. Set up backend/.env and frontend/.env"
        echo "  3. mysql -u root -p < database/amazon_eptw_db.sql"
        echo "  4. npm start"
        ;;
        
    4)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Useful Commands:"
echo "  npm start              - Start both frontend and backend"
echo "  npm test               - Run all tests"
echo "  npm run clean          - Clean all build artifacts"
echo ""
echo "Documentation:"
echo "  README.md             - Project overview"
echo "  docs/SETUP.md         - Detailed setup guide"
echo "  docs/API.md           - API documentation"
echo ""
echo "Need help? Check the documentation or contact the team."
echo ""