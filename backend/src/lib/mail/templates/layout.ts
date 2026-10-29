export const renderEmailLayout = (preview: string, content: string) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FilmForge</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0B0D10;color:#F5F7FA;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0B0D10;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;border:1px solid #252B33;border-radius:12px;background-color:#11151A;">
            <tr>
              <td style="padding:32px 36px 24px;border-bottom:1px solid #252B33;">
                <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#F5F7FA;">Film<span style="color:#7C5CFC;">Forge</span></span>
                <p style="margin:8px 0 0;font-size:11px;font-weight:700;letter-spacing:2px;color:#98A2B3;">PRODUCTION MANAGEMENT</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px;">${content}</td>
            </tr>
            <tr>
              <td style="padding:20px 36px;border-top:1px solid #252B33;font-size:12px;line-height:18px;color:#98A2B3;">
                This is an automated FilmForge security email. Please do not reply.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`
