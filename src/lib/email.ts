const LOGO_URL = "https://res.cloudinary.com/dbfcs4uvj/image/upload/v1782586720/logo_t5fydz.png";
const SITE_URL = process.env.PUBLIC_SITE_URL ?? "https://symbodied.com";

export function newsletterHtml({
  subject,
  body,
  ctaText,
  ctaUrl,
  email,
  unsubscribeUrl,
}: {
  subject: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  email: string;
  unsubscribeUrl: string;
}): string {
  const bodyHtml = body
    .split(/\n\n+/)
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;color:rgba(255,255,255,0.65);line-height:1.75;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const ctaBlock =
    ctaText && ctaUrl
      ? `<table cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 32px;">
          <tr>
            <td style="background-color:#f0c060;border-radius:10px;">
              <a href="${ctaUrl}"
                 style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#1a1a1a;text-decoration:none;letter-spacing:0.02em;">
                ${ctaText} &rarr;
              </a>
            </td>
          </tr>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f1eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f1eb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a2e1c;border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
              <div style="
                display:inline-block;width:80px;height:80px;border-radius:50%;
                background-color:rgba(255,255,255,0.12);border:1.5px solid rgba(255,255,255,0.25);
                box-shadow:0 4px 20px rgba(0,0,0,0.30),inset 0 1px 0 rgba(255,255,255,0.30);
                line-height:80px;text-align:center;vertical-align:middle;margin-bottom:18px;
              ">
                <img src="${LOGO_URL}" width="44" height="44" alt="Symbodied"
                     style="display:inline-block;vertical-align:middle;border:0;" />
              </div>
              <p style="margin:0;font-size:22px;font-weight:800;color:#f0c060;letter-spacing:0.04em;text-transform:uppercase;">
                SYMBODIED
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:0.12em;text-transform:uppercase;">
                Tradition · Heritage · Identity
              </p>
            </td>
          </tr>

          <!-- Golden divider -->
          <tr>
            <td style="background-color:#1a2e1c;padding:0 40px;">
              <div style="height:3px;background:linear-gradient(90deg,#f0c060,#d4a840,#f0c060);border-radius:2px;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#1a2e1c;border-radius:0 0 16px 16px;padding:40px 40px 48px;">
              <p style="margin:0 0 24px;font-size:26px;font-weight:700;color:#dceee3;line-height:1.3;">
                ${subject}
              </p>
              ${bodyHtml}
              ${ctaBlock}
              <p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.35);line-height:1.7;text-align:center;">
                A living symbol of tradition, heritage and collective identity —<br/>
                empowering communities through commerce, culture, and solidarity.
              </p>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:24px;"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="text-align:center;padding:0 16px 8px;">
              <p style="margin:0 0 6px;font-size:11px;color:#9a9286;">
                © 2026 Symbodied LLC. All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:#9a9286;">
                You are receiving this because you subscribed at
                <a href="${SITE_URL}" style="color:#9a9286;text-decoration:underline;">symbodied.com</a>
                with ${email}.&nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="${unsubscribeUrl}" style="color:#9a9286;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
