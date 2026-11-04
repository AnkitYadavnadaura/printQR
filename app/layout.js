import "./globals.css";
export const metadata = { title: "PrintQR", description: "Scan. Upload. Printed." };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><main>{children}</main></body>
    </html>
  );
}
