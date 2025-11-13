import type { Metadata } from "next";
import { Jura } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";
import {UserProvider} from "@/context/UserContext";
import {ConnectionProvider} from "@/context/ConnectionContext";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={jura.className}>
                <UserProvider>
                    <ConnectionProvider>
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                style: { background: "#1F2937", color: "#fff", borderRadius: "8px" },
                            }}
                        />
                        {children}
                    </ConnectionProvider>
                </UserProvider>
            </body>
        </html>
    );
}

