# PrintQR

Shop registers → gets a QR → customers scan, upload, and the file prints on the shop's printer.

## Deploy on Vercel
1. Push this folder to GitHub, import it in Vercel.
2. In the Vercel project → **Storage**: create a **Blob** store and an **Upstash Redis** store (Marketplace). Connect both to the project; env vars are added automatically.
3. Deploy. Open the site, register your shop with a password. Later, log in at `/login` with your Shop ID and password.

## Direct printing (agent)
Vercel can't reach a local printer, so a small agent runs on the shop PC:
```
cd agent && npm install
SERVER=https://your-app.vercel.app PRINTER_ID=<id> KEY=<key> node agent.mjs
```
Windows: PDF via `pdf-to-printer`, images via mspaint. macOS/Linux: uses `lp` (CUPS).
Files are deleted from storage right after printing.

## Local dev
`npm install && npm run dev` (copy env vars with `vercel env pull .env.local`).

Pending jobs older than 24 hours expire and their files are deleted.
