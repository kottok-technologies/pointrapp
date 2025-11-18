"use client";

import UserMenu from "@/components/UserMenu";

export default function Navbar() {
    return (
        <nav className="w-full bg-white shadow px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">PointrApp</h1>

            <UserMenu />
        </nav>
    );
}
