// components/Footer.tsx

"use client";

import Image from "next/image";

export default function Footer() {
    return (
        <footer className="w-full py-3 border-t border-gray-200 sticky bottom-0 bg-white z-40">
            <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">

                <div className="flex items-center gap-2">
                    <Image
                        src="/images/ktlogo.jpeg"
                        alt="Kottok Technologies Logo"
                        width={48}
                        height={48}
                        className="rounded-full"
                    />
                </div>

                <p className="text-sm text-gray-500 text-center flex-1">
                    © {new Date().getFullYear()} Kottok Technologies — All Rights Reserved
                </p>

                <a
                    href="https://buymeacoffee.com/kottok.technologies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-yellow-400 text-black font-medium rounded-lg shadow hover:bg-yellow-500 transition whitespace-nowrap"
                >
                    Buy me a coffee ☕
                </a>
            </div>
        </footer>
    );
}
