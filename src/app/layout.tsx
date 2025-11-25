import type { Metadata } from "next";
import { Jura } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "react-hot-toast";
import {UserProvider} from "@/context/UserContext";
import {ConnectionProvider} from "@/context/ConnectionContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {ModalProvider} from "@/context/ModalContext";

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
                        <ModalProvider>
                            <Navbar />
                            <Toaster
                                    position="top-right"
                                    toastOptions={{
                                        style: { background: "#1F2937", color: "#fff", borderRadius: "8px" },
                                    }}
                                />
                                {children}
                            <Footer />
                        </ModalProvider>
                    </ConnectionProvider>
                </UserProvider>
                <div id="modal-root"></div>
            </body>
        </html>
    );
}

