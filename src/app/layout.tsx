import type { Metadata } from "next";
import { Jura } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";

const jura = Jura({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pointr App",
  description: "Pointing Poker Application",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jura.className} antialiased`}
      >
      <Toaster
          position="top-right"
          toastOptions={
          {
              style: {
                  background: "#1F2937", // dark gray
                  color: "#fff",
                  borderRadius: "8px",
              },
          }
          }
          />
        {children}
      </body>
    </html>
  );
}
