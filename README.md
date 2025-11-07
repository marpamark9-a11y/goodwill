# Goodwill Bind4 System

A comprehensive facility management and reservation system with separate admin, staff, and client interfaces.

## Project Structure

The project is divided into three main parts:

- `admin/` - Admin dashboard and management interface
- `backend/` - Node.js/Express.js backend server
- `frontend/` - Client-facing web application

## Features

### Admin Dashboard
- User Management (Staff and Clients)
- Facility Management
- Reservation Management
- Reports Generation
- User Activity Logs

### Frontend
- User Registration and Authentication
- Facility Browsing
- Reservation System
- Profile Management

### Backend
- RESTful API
- JWT Authentication
- File Upload Support
- Email Notifications

## Technology Stack

- Frontend: React.js + Vite
- Admin Panel: React.js + Vite
- Backend: Node.js + Express.js
- Database: MongoDB
- Styling: Tailwind CSS
- State Management: Context API
- File Storage: Cloudinary

## Getting Started

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install dependencies for each part
```bash
# Install backend dependencies
cd backend
npm install

# Install admin panel dependencies
cd ../admin
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
Create `.env` files in both backend and frontend directories with necessary configurations.

4. Start the development servers
```bash
# Start backend server
cd backend
npm run server

# Start admin panel
cd ../admin
npm run dev

# Start frontend
cd ../frontend
npm run dev
```

## Environment Variables

### Backend
```
PORT=your_port
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Frontend & Admin
```
VITE_BACKEND_URL=your_backend_url
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.