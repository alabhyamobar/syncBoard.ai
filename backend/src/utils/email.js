import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import config from "../config/config.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { address } = await dns.lookup("smtp.gmail.com", {
  family: 4,
});

console.log(address);
// SMTP configuration loading
const smtpHost = config.SMTP_HOST;
const smtpPort = config.SMTP_PORT;
const smtpSecure = config.SMTP_SECURE;
const smtpUser = config.SMTP_USER;
const smtpPass = config.SMTP_PASS;
const smtpFrom = config.SMTP_FROM;

let transporter = null;

// Initialize connection-pooled transporter if configuration is present
if (smtpHost && smtpUser && smtpPass) {
  console.log({
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_SECURE: smtpSecure,
    SMTP_USER: smtpUser,
    SMTP_PASS: smtpPass ? "Present" : "Missing",
    SMTP_FROM: smtpFrom,
});
  transporter = nodemailer.createTransport({
    host: address,
    port: smtpPort,
    secure: smtpSecure,
    family: 4,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    pool: true, // Use a connection pool for production-grade throughput
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5, // max 5 messages per second
    // Add timeouts to prevent hanging sockets in firewalled environments
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,    // 10 seconds
    socketTimeout: 15000,      // 15 seconds
  });

  // Verify connection configuration on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error("[SMTP ERROR] Transporter connection verification failed:", error);
      console.warn("[EMAIL SERVICE] Disabling SMTP transporter due to verification failure. Falling back to local preview.");
      transporter = null;
    } else {
      console.log("[SMTP SUCCESS] Connection verified. Server is ready to deliver messages.");
    }
  });
} else {
  console.warn(
    "[EMAIL SERVICE] SMTP configuration is incomplete. Missing SMTP_HOST, SMTP_USER, or SMTP_PASS.\n" +
    "Falling back to writing local HTML previews in temp-email-preview.html."
  );
}

export const sendInviteEmail = async ({ to, workspaceName, invitedByName, inviteLink }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Workspace Invitation</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F3F4F6; padding: 40px 10px;">
        <tr>
          <td align="center">
            <!-- Main Card -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FAF8F5; border: 4px solid #000000; box-shadow: 8px 8px 0px 0px #000000; margin: auto;">
              <!-- Top Accent Bar -->
              <tr>
                <td style="background-color: #FDE047; padding: 18px 25px; border-bottom: 4px solid #000000;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td>
                        <span style="display: inline-block; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #000000;">
                          ⚡ SYNCBOARD
                        </span>
                      </td>
                      <td align="right">
                        <span style="display: inline-block; background-color: #000000; color: #FFFFFF; font-size: 11px; font-weight: 900; padding: 4px 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                          New Invite
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Email Content Body -->
              <tr>
                <td style="padding: 35px 25px;">
                  <span style="display: inline-block; background-color: #C084FC; color: black; border: 2px solid black; padding: 4px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 15px; box-shadow: 2px 2px 0px 0px black;">
                    COLLABORATION INCOMING
                  </span>
                  
                  <h1 style="margin: 0 0 25px 0; font-size: 28px; font-weight: 900; line-height: 1.1; color: #000000; text-transform: uppercase; letter-spacing: -0.5px;">
                    You've been invited to join <span style="background-color: #38BDF8; padding: 2px 8px; border: 2px solid #000000; display: inline-block; box-shadow: 3px 3px 0px 0px black; margin: 4px 0;">${workspaceName}</span>
                  </h1>
                  
                  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                    Hey there!
                  </p>
                  
                  <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #000000;">
                    <strong>${invitedByName}</strong> wants to collaborate with you. They have invited you to join the workspace <strong style="text-decoration: underline;">${workspaceName}</strong> on SyncBoard.
                  </p>

                  <!-- Action Card (Neobrutalist box) -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #E0E7FF; border: 3px solid #000000; margin: 30px 0; box-shadow: 6px 6px 0px 0px #000000;">
                    <tr>
                      <td style="padding: 24px;">
                        <p style="margin: 0 0 15px 0; font-size: 15px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">
                          Ready to start syncing?
                        </p>
                        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.5; color: #1E1B4B;">
                          Accepting this invitation will grant you access to all shared documents, live collaboration boards, and workspace settings.
                        </p>
                        
                        <a href="${inviteLink}" style="display: inline-block; background-color: #FF70A6; color: #000000; font-weight: 900; text-decoration: none; padding: 14px 28px; border: 3px solid #000000; box-shadow: 4px 4px 0px 0px #000000; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">
                          Accept Invite &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Link fallback -->
                  <p style="margin: 25px 0 0 0; font-size: 12px; line-height: 1.5; color: #4B5563;">
                    If the button above doesn't work, copy and paste this link into your browser:
                    <br>
                    <a href="${inviteLink}" style="color: #4F46E5; text-decoration: underline; font-weight: 600; word-break: break-all;">${inviteLink}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #FAF8F5; padding: 20px 25px; border-top: 4px dashed #000000;">
                  <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: 900; color: #000000; text-transform: uppercase;">
                    SyncBoard.ai &bull; Modern Collaboration
                  </p>
                  <p style="margin: 0; font-size: 11px; color: #6B7280; line-height: 1.4;">
                    This invite was sent to you because your email was added to the workspace. If you didn't expect this request, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        subject: `Join "${workspaceName}" on SyncBoard`,
        html: htmlContent,
      });

      console.log(`[EMAIL SENT VIA SMTP]: MessageId: ${info.messageId} to ${to} for workspace "${workspaceName}"`);
      return info;
    } catch (error) {
      console.error("Failed to send email via SMTP:", error);
      throw error;
    }
  } else {
    // Fallback for development/sandbox environment
    console.log("\n-----------------------------------------");
    console.log(`[NO SMTP CONFIG]: Generating Local HTML Preview`);
    console.log(`Invite Recipient: ${to}`);
    console.log(`Workspace: ${workspaceName}`);
    console.log(`Invited By: ${invitedByName}`);

    const tempFilePath = path.join(__dirname, "..", "..", "temp-email-preview.html");
    try {
      fs.writeFileSync(tempFilePath, htmlContent, "utf8");
      console.log(`Email HTML successfully written to: ${tempFilePath}`);
      console.log(`Open this file in your browser to inspect the neo-brutalist design!`);
    } catch (writeErr) {
      console.error("Failed to write email preview file:", writeErr);
    }
    console.log("-----------------------------------------\n");

    return { mock: true, previewPath: tempFilePath };
  }
};
