# Student Expense Tracker

A modern web application that helps students track their expenses with budget management and expense categorization.

## Features

- User Authentication (Login/Signup)
- Interactive Dashboard with Expense Tracking
- Expense Categorization
- Budget Management
- Responsive Design

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **State Management**: Redux Toolkit
- **Data Visualization**: Chart.js, Recharts

## Prerequisites

- Node.js (v16 or later)
- MySQL Server (v8.0 or later)
- npm or yarn package manager

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   DB_NAME=student_expense_tracker
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_HOST=localhost
   JWT_SECRET=your_secure_jwt_secret
   PORT=3002
   NODE_ENV=development
   ```

4. Create a MySQL database:
   ```sql
   CREATE DATABASE student_expense_tracker;
   ```

5. Start the backend server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

### Frontend Setup

1. Navigate to the project root directory:
   ```bash
   cd ..
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Environment Variables

### Backend (`.env`)

| Variable      | Description                           | Default               |
|---------------|---------------------------------------|-----------------------|
| DB_NAME       | MySQL database name                   | student_expense_tracker |
| DB_USER       | MySQL username                        | root                  |
| DB_PASSWORD   | MySQL password                        | -                     |
| DB_HOST       | MySQL host address                    | localhost             |
| JWT_SECRET    | Secret key for JWT token generation   | - (required)          |
| PORT          | Backend server port                   | 3002                  |
| NODE_ENV      | Node environment (development/production) | development        |

## Project Structure

```
student-expense-tracker/
├── backend/              # Node.js backend server
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   └── utils/          # Utility functions
├── public/              # Static assets
└── package.json        # Project dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
