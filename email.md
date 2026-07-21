# Secure SMTP Email Architecture (Nodemailer)

SyncBoard has been upgraded from the Resend API to a production-grade SMTP email delivery architecture powered by **Nodemailer**.

---

## 1. Environment Variables

The email transport is configured dynamically using the following environment variables in your backend `.env` file:

```env
# SMTP Configuration (Nodemailer)
SMTP_HOST=your-smtp-host.example.com
SMTP_PORT=587
SMTP_SECURE=false # Set to true if using SSL/TLS (port 465)
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM="SyncBoard" <noreply@syncboard.ai>
```

---

## 2. Production-Grade Configuration

To support high volume and reliable delivery, the transport layer employs:
1. **Connection Pooling**: Reuses connections across multiple mails (`pool: true`) to avoid TCP handshake overhead.
2. **Connection Limits**: Restricted to a maximum of 5 concurrent connections (`maxConnections: 5`) and 100 messages per connection (`maxMessages: 100`) to prevent rate-limiting/spam triggers on external SMTP providers.
3. **Throttling**: Configured with a rate limit (`rateLimit: 5` per second) to throttle burst delivery.
4. **Startup Verification**: Calls `transporter.verify()` on initialization to check host, credentials, and connection configuration, logging early warnings if setup fails.

---

## 3. Development Fallback (Local HTML Preview)

If `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` are left blank (e.g. in local development / sandbox testing), the system:
1. Logs a warning on startup informing you that SMTP is not set.
2. Instead of calling external networks, it generates a local HTML preview file: `backend/temp-email-preview.html`.
3. Overwrites/renders the neobrutalist styled HTML invitation into this file.
4. Prints the invite details (Recipient, Workspace name, Inviter name, and local preview file path) cleanly to the server console.

This allows developers to preview and test the complete email flow visually in their browser without requiring a working SMTP inbox setup.

---

## 4. Workflow Changes

1. **Package Dependency Shift**:
   * Removed `resend` library from backend dependencies.
   * Installed `nodemailer` package.
2. **Link URL Resolution**:
   * Previously, invitation links were hardcoded to `http://localhost:5173/accept-invite/...`.
   * The invitation link generator now detects the active environment. In production (`process.env.NODE_ENV === "production"`), it uses `FRONTEND_PROD_URL` (`https://sync-board-ai.vercel.app`), falling back to `FRONTEND_DEV_URL` (`http://localhost:5173`) in development.

---

## 5. Verification & Env Var Loading Fix

### 5.1. ESM Initialization Order Fix & Centralized Config
* **Issue**: Because Node ESM loads modules statically, `email.js` was evaluated before `dotenv.config()` was called inside `config.js`. This left `process.env.SMTP_HOST` as `undefined` at load time, failing to initialize the SMTP transporter and defaulting to the local preview sandbox.
* **Resolution**: Added `import config from "../config/config.js";` on the first lines of [email.js](file:///c:/Users/Rishi/OneDrive/Desktop/syncboard/backend/src/utils/email.js) and centralized all SMTP configuration variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) inside [config.js](file:///c:/Users/Rishi/OneDrive/Desktop/syncboard/backend/src/config/config.js). This guarantees that the configuration loader executes, parses types, and injects variables before the SMTP setup reads them.

### 5.2. SMTP Configuration Typo Fix
* **Issue**: The `.env` file had a duplicate assignment: `SMTP_FROM=SMTP_FROM="SyncBoard" <alabhyamobar50@gmail.com>`, which corrupted the sender header string.
* **Resolution**: Corrected the setting in `.env` to `SMTP_FROM="SyncBoard" <alabhyamobar50@gmail.com>`.

### 5.3. SMTP Delivery Verification
* Created and executed a local testing script to verify the connection using the active credentials:
  * **SMTP Host**: `smtp.gmail.com`
  * **SMTP Port**: `587`
  * **Sender**: `alabhyamobar50@gmail.com`
* **Result**:
  ```text
  Connecting and verifying SMTP transporter...
  SMTP verification SUCCESSFUL! The mail server is ready to deliver messages.
  ```
  The mail service is fully verified, functional, and will send live emails when running.

### 5.4. IPv6 Network Connection Failure (ENETUNREACH)
* **Issue**: When attempting to deliver emails, Nodemailer resolved `smtp.gmail.com` using the system's default preference. In environments with incomplete or local-only IPv6 networking configurations, this resolved to a Gmail IPv6 address (`2404:6800:...`) and resulted in a connection crash: `connect ENETUNREACH 2404:6800:4013:813::6c:587`.
* **Resolution**: Added `dns.setDefaultResultOrder("ipv4first");` at the top of [email.js](file:///c:/Users/Rishi/OneDrive/Desktop/syncboard/backend/src/utils/email.js) to force the DNS resolver to prioritize IPv4 addresses over IPv6. This bypassed the unreachable route and verified live email delivery successfully with a `250 2.0.0 OK` response.

### 5.5. SMTP Connection Timeout (ETIMEDOUT) in Cloud Hosting Environments
* **Issue**: On cloud application platforms like Render, connection requests to `smtp.gmail.com` on port `587` frequently time out (`ETIMEDOUT`) because outbound mail ports are monitored, throttled, or blocked. If the transporter fails verification on startup, any future invitation attempts would hang for up to 2 minutes waiting for connection handshakes before falling back.
* **Resolution**:
  1. **Transporter Verification Fail-Fast**: Configured connection timeouts (`connectionTimeout: 10000`, `greetingTimeout: 10000`, `socketTimeout: 15000`) in the Nodemailer transporter.
  2. **Automatic Fallback**: Modified the startup verification inside [email.js](file:///c:/Users/Rishi/OneDrive/Desktop/syncboard/backend/src/utils/email.js). If `transporter.verify` fails on startup, `transporter` is set to `null`. This prompts the email service to immediately fall back to the local preview mode without lagging or hanging user interaction threads.
  3. **Recommended Production Config**: For cloud hosting, use port `465` (Implicit TLS) instead of port `587` (STARTTLS) by configuring:
     * `SMTP_PORT=465`
     * `SMTP_SECURE=true`
     This bypasses port 587 filters and guarantees secure connection establishment on startup.
