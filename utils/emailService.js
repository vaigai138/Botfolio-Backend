import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT), // Ensure port is an integer
    secure: process.env.EMAIL_PORT === '465', // true for 465 (SSL), false for other ports (TLS)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false // This line is sometimes needed for local development with self-signed certs, remove in production if possible
    }
});

export const sendWelcomeEmail = async (toEmail, name) => {
    const mailOptions = {
        from: `"Botfolio Team" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: '🎉 Welcome to Botfolio!',
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; padding: 24px; background-color: #ffffff; color: #333; box-shadow: 0 0 15px rgba(0,0,0,0.05);">
        <div style="text-align: center; padding-bottom: 20px;">
         <style>
      @import url('https://fonts.googleapis.com/css2?family=Pacifico&display=swap');
    </style>

     <div style="text-align: center; margin-bottom: 24px;">
  <span style="
    color: #F4A100;
    font-family: 'Pacifico', cursive;
    font-size: 24px;
    font-weight: bold;
    display: block;
  ">
    Botfolio
  </span>
</div>
          <h2 style="color: #F4A100; margin: 0; padding: 0; font-size: 28px;">Welcome to Botfolio, ${name}!</h2>
        </div>

        <p style="font-size: 16px; line-height: 1.6; color: #444;">
          We're absolutely thrilled to have you join our community 🎉<br />
          Botfolio is designed to be your ultimate platform for showcasing your creative projects, connecting with clients, and building your professional presence.
        </p>

        <p style="font-size: 16px; line-height: 1.6; margin-top: 25px; color: #444;">
          Ready to make your mark? Dive into your personalized dashboard and start crafting your impressive portfolio today!
        </p>

        <div style="margin: 35px 0; text-align: center;">
          <a href="http://localhost:5173/dashboard" style="display: inline-block; padding: 15px 30px; background-color: #F4A100; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 5px 15px rgba(244, 161, 0, 0.4); transition: background-color 0.3s ease;">
            🚀 Go to your Dashboard
          </a>
        </div>

        <p style="font-size: 14px; color: #666; line-height: 1.5; margin-top: 35px;">
          If you have any questions, brilliant ideas, or need a hand with anything, don't hesitate to reach out! Our team is always here to support your journey.
        </p>
        <p style="font-size: 14px; color: #666; line-height: 1.5; margin-top: 15px;">
          Warmly,<br />
          — The Botfolio Team
        </p>

        <hr style="margin: 40px 0; border: 0; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} Botfolio. All rights reserved.<br />
          This email was sent to ${toEmail}.
        </p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${toEmail}`);
    } catch (error) {
        console.error(`Error sending welcome email to ${toEmail}:`, error);
    }
};