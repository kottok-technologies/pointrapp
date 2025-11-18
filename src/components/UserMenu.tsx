"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import EditUserModal from "@/components/EditUserModal";

export default function UserMenu() {
    const { user, logout } = useUser();
    const [open, setOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);


    if (!user) {
        return <></>
    }

    const logoutUser = () => {
        logout();
        setOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>

            {/* Avatar Button */}
            <button
                className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center shadow"
                onClick={() => setOpen((o) => !o)}
            >
                {user.avatarUrl ? (
                    <Image
                        src={user.avatarUrl}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="object-cover"
                    />
                ) : (
                    <span className="text-lg font-semibold text-gray-700">
                        {user.name?.charAt(0).toUpperCase()}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-xl py-2 border border-gray-200 z-50 animate-fadeIn">
                    <button
                        className="block w-full px-4 py-2 text-left hover:bg-gray-100"
                        onClick={() => {
                            setShowEditModal(true);
                            setOpen(false);
                        }}
                    >
                        Edit User
                    </button>

                    <button
                        className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                        onClick={logoutUser}
                    >
                        Log Out
                    </button>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <EditUserModal
                    initialName={user.name}
                    onClose={() => setShowEditModal(false)}
                />
            )}
        </div>
    );
}
