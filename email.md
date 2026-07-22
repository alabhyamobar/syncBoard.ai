# Production Email Delivery Architecture (Resend API)

SyncBoard's email infrastructure is powered entirely by **Resend** using their production-grade Node.js HTTPS API SDK (`resend`).

---

## 1. Why Resend? (Zero SMTP Port & Firewall Issues)

Unlike traditional SMTP transports which rely on raw TCP connections (Ports 587/465) that are frequently throttled or blocked by cloud hosting firewalls (such as Render, AWS EC2, and Railway), **Resend operates over encrypted HTTPS REST API calls (Port 443)**.

### Advantages of Resend over SMTP:
- **100% Cloud Compatible**: Works out-of-the-box on Render, Vercel, Railway, AWS Lambda, Docker, and local dev.
- **Zero Firewall / Socket Errors**: Eliminates TCP connection timeouts (`ETIMEDOUT`) and IPv6 socket binding errors (`ENETUNREACH`).
- **High Throughput & Speed**: Ultra-fast HTTPS API requests with instant delivery status callbacks.
- **3,000 Free Emails / Month**: Generous free tier suitable for production applications.

---

## 2. Environment Variables

Configure your backend `.env` file or **Render Environment Variables** panel:

```env
# Resend API Configuration
RESEND_API_KEY=re_123456789_your_api_key_here
EMAIL_FROM="SyncBoard" <onboarding@resend.dev> # Or your verified custom domain e.g. "SyncBoard" <noreply@yourdomain.com>
```

---

## 3. Architecture & Development Fallback

1. **Production Resend Dispatch**:
   When `RESEND_API_KEY` is present in environment variables:
   - Instantiates `new Resend(process.env.RESEND_API_KEY)`.
   - Dispatches HTML invitations via `resend.emails.send()`.
   - Logs the returned Resend Message ID: `[RESEND EMAIL SENT]: Message ID: 49540b67-e9a9-4509-ad05-4f4007907572`.

2. **Development / Local Sandbox Fallback**:
   If `RESEND_API_KEY` is not configured (e.g. in local development / sandbox testing):
   - Logs a warning informing developers that Resend API key is missing.
   - Generates a local HTML preview file: `backend/temp-email-preview.html`.
   - Renders the full neo-brutalist styled HTML invitation into `temp-email-preview.html` for local visual testing.

3. **API Level Resilience**:
   In `workspace.controller.js`, workspace invitations will **never break user flows**. If email dispatch encounters network issues or unverified domain restrictions in testing, the API catches the error gracefully and returns the direct `inviteLink` in the JSON response for manual sharing.

---

## 4. Render Setup Instructions

1. Create a free account at [resend.com](https://resend.com).
2. Go to **API Keys** and generate an API key (`re_...`).
3. Add the variable to your **Render Web Service -> Environment**:
   - `RESEND_API_KEY` = `re_your_api_key`
   - `EMAIL_FROM` = `"SyncBoard" <onboarding@resend.dev>`
4. Trigger a deploy or send a workspace invitation!
