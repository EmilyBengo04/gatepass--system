const nodemailer = require("nodemailer");

// If SMTP credentials are not configured, fall back to logging the email
// to the console so the visitor flow still works end-to-end in development.
const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

/**
 * Sends the "a visitor has arrived for you" email to the host employee.
 * Returns { status: 'sent' | 'failed', error? }
 */
async function sendHostNotification({ to, hostName, visitorName, purpose, arrivedAt }) {
  const subject = `${visitorName} has arrived to see you`;
  const timeStr = new Date(arrivedAt).toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0f172a;">Visitor arrived: ${escapeHtml(visitorName)}</h2>
      <p>Hi ${escapeHtml(hostName)},</p>
      <p><strong>${escapeHtml(visitorName)}</strong> has just signed in at the gate to see you.</p>
      <table style="margin-top:12px; font-size:14px; color:#334155;">
        <tr><td style="padding:4px 8px 4px 0;"><strong>Purpose</strong></td><td>${escapeHtml(purpose || "Not specified")}</td></tr>
        <tr><td style="padding:4px 8px 4px 0;"><strong>Arrived at</strong></td><td>${timeStr}</td></tr>
      </table>
      <p style="margin-top:16px;">Please head to reception, or let the security desk know if you'd like the visit rescheduled.</p>
      <p style="color:#94a3b8; font-size:12px; margin-top:24px;">Sent automatically by GatePass.</p>
    </div>
  `;

  if (!transporter) {
    console.log("--------------------------------------------------");
    console.log("[MAILER] SMTP not configured — logging email instead of sending:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Visitor: ${visitorName}, Purpose: ${purpose}, Arrived: ${timeStr}`);
    console.log("--------------------------------------------------");
    return { status: "sent" }; // treated as delivered in dev/log mode
  }

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || "GatePass <no-reply@gatepass.local>",
      to,
      subject,
      html,
    });
    return { status: "sent" };
  } catch (error) {
    console.error("Failed to send host notification email:", error.message);
    return { status: "failed", error: error.message };
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = { sendHostNotification };
