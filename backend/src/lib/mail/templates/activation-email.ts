import { renderEmailLayout } from './layout.js'

export const renderActivationEmail = (code: string) =>
  renderEmailLayout(
    'Your FilmForge activation code expires in 10 minutes.',
    `
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:2px;color:#A994FF;">ACCOUNT ACTIVATION</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:34px;color:#F5F7FA;">Verify your work email</h1>
      <p style="margin:0 0 28px;font-size:15px;line-height:24px;color:#C5CBD3;">Enter this code in FilmForge to continue setting up your account.</p>
      <div style="padding:22px 16px;border:1px solid #343C46;border-radius:8px;background-color:#171C22;text-align:center;">
        <span style="font-size:32px;font-weight:700;letter-spacing:10px;color:#F5F7FA;">${code}</span>
      </div>
      <p style="margin:24px 0 0;font-size:14px;line-height:22px;color:#C5CBD3;">This code expires in <strong style="color:#F5F7FA;">10 minutes</strong>. Do not share it with anyone.</p>
      <p style="margin:12px 0 0;font-size:13px;line-height:20px;color:#98A2B3;">If you did not expect this email, you can ignore it.</p>
    `,
  )
