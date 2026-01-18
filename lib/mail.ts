import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const domain = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

export const sendPasswordResetEmail = async (email: string, token: string) => {
    if (!resend) {
        console.warn("RESEND_API_KEY is missing in environment variables. Email sending skipped.");
        console.log("Password reset token:", token);
        return false; // Or true if you want to simulate success in dev
    }

    const resetLink = `${domain}/reset-password?token=${token}`;

    try {
        const { data, error } = await resend.emails.send({
            from: "IP Address System <onboarding@resend.dev>",
            to: email,
            subject: "Reset your password",
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(to right, #f59e0b, #d97706); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px; color: #333333; line-height: 1.6; }
            .button { display: inline-block; background: linear-gradient(to right, #f59e0b, #d97706); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3); }
            .footer { background-color: #f4f4f5; padding: 20px; text-align: center; color: #71717a; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset the password for your account associated with <strong>${email}</strong>.</p>
              <p>If you made this request, please click the button below to securely reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} IP Address Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        });

        if (error) {
            console.error("Error sending email:", error);
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
