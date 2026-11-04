export const peerServerOptions = {
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  secure: true,
  config: {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  },
};

export function printerPeerId(shopId) {
  return `printqr-${shopId}`;
}
