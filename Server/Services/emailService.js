const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Celestiq Finance" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - Celestiq Finance',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌟 Welcome to Celestiq Finance!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for registering with Celestiq Finance. To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">This code will expire in 10 minutes</p>
              </div>

              <p>If you didn't request this verification, please ignore this email.</p>
              
              <p style="margin-top: 30px;">
                <strong>Why Celestiq Finance?</strong><br>
                • Track expenses and income in real-time<br>
                • Manage investments across multiple brokers<br>
                • Set budgets and savings goals<br>
                • Get insights into your financial health
              </p>

              <div class="footer">
                <p>© ${new Date().getFullYear()} Celestiq Finance. All rights reserved.</p>
                <p>This is an automated email, please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Celestiq Finance" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Celestiq Finance! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Celestiq Finance!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Your account has been successfully verified. Welcome to your financial journey with Celestiq Finance!</p>
              
              <h3>🚀 Get Started:</h3>
              <div class="feature-box">
                <strong>📊 Track Your Finances</strong><br>
                Add your first expense or income to start tracking your financial health.
              </div>
              <div class="feature-box">
                <strong>💰 Manage Investments</strong><br>
                Connect your broker accounts or manually add your investment portfolio.
              </div>
              <div class="feature-box">
                <strong>🎯 Set Goals</strong><br>
                Create budgets and savings goals to stay on track with your financial plans.
              </div>
              <div class="feature-box">
                <strong>📈 Monitor Progress</strong><br>
                View your financial health score and get insights into your spending habits.
              </div>

              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL}" class="button">Start Managing Your Finances</a>
              </p>

              <p style="margin-top: 30px; font-size: 14px;">
                Need help? Check out our documentation or contact our support team.
              </p>

              <div class="footer">
                <p>© ${new Date().getFullYear()} Celestiq Finance. All rights reserved.</p>
                <p>You're receiving this email because you signed up for Celestiq Finance.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail
};