import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

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
  })
}
