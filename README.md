# Kodbank - Banking Application

A secure banking application with JWT authentication, registration, login, and balance checking features.

## Features

- **User Registration**: Register with uid, username, email, phone, and password
- **Customer Role Only**: Enforces Customer role for all registered users
- **JWT Authentication**: Secure login with JWT tokens
- **Balance Display**: Default balance of 1,00,000 for new users
- **Dashboard**: User-friendly dashboard with Check Balance functionality
- **Confetti Animation**: Celebratory animation when checking balance

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (can be switched to MySQL)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs for password hashing
- **Frontend**: HTML, CSS, JavaScript

## Project Structure

```
kodbank/
├── package.json          # Project dependencies
├── server.js             # Main server file
├── config/
│   ├── database.js       # Database configuration
│   └── initDb.js        # Database initialization
├── public/
│   ├── index.html        # Home page
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── dashboard.html    # User dashboard
│   └── styles.css       # CSS styles
└── .gitignore           # Git ignore file
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/DarshanBG1631/kodBank-Application.git
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## API Endpoints

### Registration
- **URL**: `/api/register`
- **Method**: POST
- **Body**:
```json
{
  "uid": "user123",
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123"
}
```
- **Response**: Success message with redirect to login

### Login
- **URL**: `/api/login`
- **Method**: POST
- **Body**:
```json
{
  "username": "johndoe",
  "password": "password123"
}
```
- **Response**: JWT token and redirect to dashboard

### Check Balance (Protected)
- **URL**: `/api/check-balance`
- **Method**: GET
- **Headers**: `Cookie: authToken=<jwt_token>`
- **Response**: User balance

### Logout
- **URL**: `/api/logout`
- **Method**: POST
- **Response**: Success message with redirect to login

## Database Schema

### KodUser Table
| Column   | Type     | Description              |
|----------|----------|--------------------------|
| uid      | TEXT     | Unique user ID           |
| username | TEXT     | Username (unique)        |
| email    | TEXT     | Email (unique)           |
| password | TEXT     | Hashed password          |
| balance  | REAL     | Account balance          |
| phone    | TEXT     | Phone number             |
| role     | TEXT     | User role (Customer)     |

### UserToken Table
| Column   | Type     | Description              |
|----------|----------|--------------------------|
| tid      | TEXT     | Unique token ID          |
| token    | TEXT     | JWT token                |
| uid      | TEXT     | User ID (foreign key)    |
| expiry   | DATETIME | Token expiry time        |

## Security Features

- Passwords are encrypted using bcryptjs
- JWT tokens are verified before any protected action
- Token expiry is checked
- Invalid/expired tokens are rejected
- Tokens stored in database for session management

## Screens

1. **Home Page**: Welcome screen with Login/Register buttons
2. **Register Page**: Registration form with validation
3. **Login Page**: Login form with username/password
4. **Dashboard**: Shows "Check Balance" button with confetti animation

## Running the Application

```bash
# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:3000
```

## License

MIT License
