import nodemailer from 'nodemailer'
import { env } from '../../config/env.js'
import { renderActivationEmail } from './templates/activation-email.js'
import { renderPasswordResetEmail } from './templates/password-reset-email.js'

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
})

export const sendActivationCodeEmail = async (
  to: string,
  code: string,
): Promise<void> => {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'FilmForge activation code',
    text: `Your FilmForge activation code is ${code}. It expires in 10 minutes.`,
    html: renderActivationEmail(code),
  })
}

export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
): Promise<void> => {
  const resetUrl = new URL('http://localhost:3000/reset-password')
  resetUrl.searchParams.set('token', resetToken)
  const link = resetUrl.toString()

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: 'FilmForge password reset',
    text: `Open this link to reset your FilmForge password: ${link}\nThe link expires in 30 minutes. If you did not request a reset, ignore this email.`,
    html: renderPasswordResetEmail(link),
  })
}
