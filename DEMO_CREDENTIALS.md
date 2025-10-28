# Demo User Credentials

This application includes pre-configured demo users for testing different roles.

## Available Demo Accounts

### Borrower Account
- **Email:** borrower@demo.com
- **Password:** borrower123
- **Role:** borrower
- **Access:** Can submit loan applications and view their own application status

### Loan Officer Account
- **Email:** officer@demo.com
- **Password:** officer123
- **Role:** loan_officer
- **Access:** Can view all applications, override AI decisions

### Compliance Auditor Account
- **Email:** auditor@demo.com
- **Password:** auditor123
- **Role:** compliance_auditor
- **Access:** Can view all applications and audit logs

### Admin Account
- **Email:** admin@demo.com
- **Password:** admin123
- **Role:** admin
- **Access:** Full system access including user management

## How to Log In

1. Navigate to the login page
2. Enter the email and password for the role you want to test
3. Click "Login"

## Security Note

⚠️ **These are demo credentials for development/testing purposes only.**

- Passwords are hashed using SHA-256
- In production, these accounts should be removed or have their credentials changed
- Use a more robust password hashing algorithm (like bcrypt or Argon2) for production
