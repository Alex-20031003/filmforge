import { renderEmailLayout } from './layout.js'

export const renderPasswordResetEmail = (link: string) =>
  renderEmailLayout(
    'Reset your FilmForge password. This link expires in 30 minutes.',
    `
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:2px;color:#A994FF;">ACCOUNT SECURITY</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:34px;color:#F5F7FA;">Reset your password</h1>
      <p style="margin:0 0 28px;font-size:15px;line-height:24px;color:#C5CBD3;">We received a request to reset your FilmForge password. Use the button below to choose a new one.</p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td bgcolor="#7C5CFC" style="border-radius:8px;">
            <a href="${link}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:700;line-height:20px;color:#FFFFFF;text-decoration:none;">Reset password</a>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 8px;font-size:14px;line-height:22px;color:#C5CBD3;">This link expires in <strong style="color:#F5F7FA;">30 minutes</strong> and can be used once.</p>
      <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#98A2B3;">Button not working? Copy this link into your browser:</p>
      <p style="margin:0 0 24px;overflow-wrap:anywhere;word-break:break-all;font-size:12px;line-height:19px;"><a href="${link}" style="color:#A994FF;text-decoration:underline;">${link}</a></p>
      <p style="margin:0;font-size:13px;line-height:20px;color:#98A2B3;">If you did not request a password reset, you can ignore this email.</p>
    `,
  )
