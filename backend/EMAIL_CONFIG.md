# Email Configuration Guide

This project is configured to use [Nodemailer](https://nodemailer.com/) for sending emails. It is designed to work with any SMTP provider, such as Gmail, Outlook, Yahoo, SendGrid, Mailgun, etc.

## 🚀 How to Configure

All email settings are managed in the `backend/.env` file.

### 1. Gmail Configuration
To use Gmail, you must specific an App Password (do not use your regular login password).
1. Go to your Google Account > Security.
2. Enable "2-Step Verification".
3. Setup an "App Password" (search for it in the search bar).
4. Use the generated 16-character password in `.env`.

```properties
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### 2. Outlook / Hotmail Configuration
```properties
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-outlook-password
```

### 3. Testing (Zero Config)
If you do not provide any credentials in `.env` (or remove them), the system will automatically fall back to [Ethereal Email](https://ethereal.email). This is a fake SMTP service useful for testing. 
- The system will create a temporary account for you.
- It will log a URL to the console where you can view the sent emails.

## 🧪 Testing Your Configuration

We have provided a test script to verify your email settings.

Run the following command in the `backend` directory:

```bash
node tests/testEmail.js
```

If successful, it will send a test email to the configured `EMAIL_USER` address.
