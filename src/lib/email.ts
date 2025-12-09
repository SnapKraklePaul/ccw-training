import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

/**
 * Send email verification link to user
 * @param email - User's email address
 * @param token - Verification token
 */
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`

  try {
    await resend.emails.send({
      from: "CCW Training <onboarding@resend.dev>", // Resend's test email
      to: email,
      subject: "Verify your email address",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #1a73e8; margin-top: 0;">Verify Your Email Address</h1>
              <p style="font-size: 16px; margin-bottom: 30px;">
                Thank you for registering with CCW Training! Please verify your email address to complete your registration.
              </p>
              <a href="${verificationUrl}" 
                 style="display: inline-block; background-color: #1a73e8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify Email Address
              </a>
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #1a73e8; word-break: break-all;">
                  ${verificationUrl}
                </a>
              </p>
            </div>
            <div style="font-size: 12px; color: #999; text-align: center;">
              <p>This verification link will expire in 24 hours.</p>
              <p>If you didn't create an account with CCW Training, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send verification email:", error)
    return { success: false, error }
  }
}

/**
 * Send password reset email to user
 * @param email - User's email address
 * @param token - Reset token
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

  try {
    await resend.emails.send({
      from: "CCW Training <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #dc3545; margin-top: 0;">Reset Your Password</h1>
              <p style="font-size: 16px; margin-bottom: 30px;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #dc3545; word-break: break-all;">
                  ${resetUrl}
                </a>
              </p>
            </div>
            <div style="font-size: 12px; color: #999; text-align: center;">
              <p>This password reset link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
            </div>
          </body>
        </html>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    return { success: false, error }
  }
}