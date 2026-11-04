# PrintQR

Shop registers a QR code; customers scan it and send a PDF or image directly to the shop's printer PC.

## How it works

- The website is hosted on Vercel.
- Shop details are saved in the registering browser only. There is no account database or password recovery.
- The printer PC runs a local agent and keeps its browser tab open.
- Customer files travel directly from the customer's browser to the printer-agent browser over WebRTC. The local agent passes the file to the printer; files are not uploaded to Vercel.
- PeerJS's public signalling service (`0.peerjs.com`) and Google's public STUN server are used to connect peers. File data is not sent through either service. Direct connections can fail on restrictive networks; TURN relays are disabled, so some networks will not work.

## Deploy the website

Import this folder into Vercel as a Next.js project. Leave **Output Directory** blank; do not set it to `public`. No Vercel Storage, Redis, or environment variables are required.

## Create a shop

1. Open the deployed site and create a shop in the browser you will use to manage it.
2. Print the QR code from the dashboard. The shop list is stored only in that browser; clearing its data or changing devices loses the dashboard entry.

## Start the printer agent on Windows

Install Node.js 18 or newer on the shop PC. Copy or clone this project to that PC, then run in PowerShell:

```powershell
cd C:\path\to\printqr\agent
npm install
$env:SHOP_ID = "the-shop-id-shown-in-your-dashboard"
node .\agent.mjs
```

Open `http://localhost:4317` in a browser on the same PC and leave the tab open. The page must show **Online and waiting for files**. Set `$env:PRINTER_NAME` before starting the agent to choose a specific printer; otherwise the default printer is used.

The agent also supports macOS/Linux when CUPS (`lp`) is installed.

## Development

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. To test printing, start the printer agent with the shop ID and open its local page on the printer PC.

Files are limited to PDF, JPG, and PNG, up to 25 MB each.
