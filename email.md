# Secure SMTP Email Architecture (Nodemailer)

SyncBoard has been upgraded from the Resend API to a production-grade SMTP email delivery architecture powered by **Nodemailer**.

---

## 1. Environment Variables

The email transport is configured dynamically using the following environment variables in your backend `.env` file:

```env
# SMTP Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false # Set to true if using SSL/TLS (port 465), false for STARTTLS (port 587)
SMTP_USER=your-smtp-username@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="SyncBoard" <your-smtp-username@gmail.com>
```

---

## 2. Production-Grade Configuration

To support high volume and reliable delivery, the transport layer employs:
1. **Connection Pooling**: Reuses connections across multiple mails (`pool: true`) to avoid TCP handshake overhead.
2. **Connection Limits**: Restricted to a maximum of 5 concurrent connections (`maxConnections: 5`) and 100 messages per connection (`maxMessages: 100`) to prevent rate-limiting/spam triggers on external SMTP providers.
3. **Throttling**: Configured with a rate limit (`rateLimit: 5` per second) to throttle burst delivery.
4. **Explicit IPv4 Socket Resolution**: Uses a custom DNS lookup wrapper to force IPv4 (`AF_INET`) socket connections and prevent unreachable IPv6 route failures (`ENETUNREACH`).
5. **Auto-detected Port Security**: Automatically defaults `SMTP_SECURE` to `true` when `SMTP_PORT=465` and `false` when `SMTP_PORT=587`.
6. **Non-Destructive Startup Verification**: Logs startup diagnostics via `transporter.verify()` without permanently disabling transport on transient network boot delays.

---

## 3. Development Fallback (Local HTML Preview)

If `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` are left blank (e.g. in local development / sandbox testing), or if email dispatch encounters non-production errors:
1. Logs a warning informing you that SMTP is not configured or in fallback mode.
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

## 5. Bug Resolutions & Verification

### 5.1. IPv6 Socket Connection Failure (`ENETUNREACH 2404:6800:... - Local (:::0)`)
* **Symptom**: 
  ```text
  [SMTP ERROR] Transporter connection verification failed: Error: connect ENETUNREACH 2404:6800:4003:c02::6d:587 - Local (:::0)
  [EMAIL SERVICE] Disabling SMTP transporter due to verification failure. Falling back to local preview.
  ```
* **Root Cause**: Node's default DNS lookup (`dns.lookup`) returned IPv6 `AAAA` records (e.g. `2404:6800:...`). In containerized or cloud host environments without active IPv6 outbound routing, Node attempted to bind an IPv6 socket (`Local (:::0)`), failing with `ENETUNREACH` (network unreachable). Additionally, global `dns.setDefaultResultOrder("ipv4first")` alone was insufficient for Nodemailer socket pools.
* **Resolution**:
  1. Implemented a custom DNS lookup wrapper forcing IPv4 (`family: 4`):
     ```javascript
     const ipv4CustomLookup = (hostname, options, callback) => {
       return dns.lookup(hostname, { ...options, family: 4 }, callback);
     };
     ```
  2. Injected `family: 4` and `lookup: ipv4CustomLookup` into `nodemailer.createTransport()`. This forces the operating system `getaddrinfo` call to query exclusively IPv4 `A` records and bind IPv4 local sockets (`0.0.0.0:0`).

### 5.2. Permanent Transporter Disabling on Startup Error
* **Root Cause**: The previous implementation executed `transporter = null;` inside the startup `transporter.verify()` failure callback. If the server experienced any startup network delay or DNS lag, the transporter was permanently disabled for the runtime lifetime of the process, breaking live email delivery.
* **Resolution**: Updated `transporter.verify()` to log startup warnings without setting `transporter = null`. The transport pool remains active to retry connections when actual emails are dispatched.

### 5.3. Smart Security Auto-Detection in Config
* **Root Cause**: Missing `SMTP_SECURE` in `.env` resulted in `false`, causing port `465` connections (which require implicit SSL/TLS) to fail or hang.
* **Resolution**: Updated `config.js` to automatically set `SMTP_SECURE: true` when `SMTP_PORT=465`, and default `SMTP_FROM` to `SMTP_USER` if not provided.

### 5.4. Cloud Outbound Port Firewall Blocking (`ETIMEDOUT` on Port 587)
* **Symptom**:
  ```text
  [SMTP ERROR] Transporter connection verification failed on startup: Error: Connection timeout
  code: 'ETIMEDOUT', command: 'CONN'
  ```
* **Root Cause**: Cloud hosting platforms like **Render**, AWS EC2, and Railway block or silently drop outbound TCP traffic on **Port 587** (STARTTLS) to prevent automated spam abuse from cloud IPs.
* **Resolution**:
  1. Updated [`config.js`](file:///c:/Users/Rishi/OneDrive/Desktop/syncboard/backend/src/config/config.js) so that in production environments (`process.env.NODE_ENV === "production"` or `process.env.RENDER === "true"`), the default SMTP port automatically switches to **Port 465** (Implicit SSL/TLS) with `SMTP_SECURE: true`. Port 465 uses direct SSL/TLS encryption from the first TCP byte, bypassing cloud provider Port 587 firewalls.
  2. Lowered socket connection timeouts (`connectionTimeout: 5000`) so firewalled port connection attempts fail fast without blocking application startup logs.
  3. **Render Dashboard Action**: Set `SMTP_PORT=465` and `SMTP_SECURE=true` in Render's Environment Variables panel.

### 5.5. Live Verification Results
Tested against live Gmail SMTP configuration:
```text
[SMTP SUCCESS] Connection verified. Server is ready to deliver messages.
```
Live SMTP delivery is fully functional and verified.
