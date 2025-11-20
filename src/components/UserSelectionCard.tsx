"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { Card } from "@/components/Card";
import EditUserModal from "@/components/EditUserModal"; // You'll build this
import Image from "next/image";

export default function UserSelectionCard() {
    const { availableUsers, switchUser } = useUser();
    const [isModalOpen, setModalOpen] = useState(false);

    const [newUserName, setNewUserName] = useState("");

    return (
        <Card>
            <div className="flex flex-col gap-6">

                {/* ===========================================================
                  Existing Users
                =========================================================== */}
                {Object.keys(availableUsers).length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Select a User
                        </h2>

                        <div className="flex flex-wrap gap-3">
                            {Object.values(availableUsers).map((u) => (
                                <button
                                    key={u.id}
                                    onClick={() => switchUser(u.id)}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition shadow-sm"
                                >
                                    <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
                                        {u.avatarUrl ? (
                                            <Image
                                                src={u.avatarUrl}
                                                alt={u.name}
                                                width={64}
                                                height={64}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="text-xl font-semibold text-gray-700">
                                                {u.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-800">
                                        {u.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===========================================================
                  New User Section
                =========================================================== */}
                <div className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold text-gray-800">Create New User</h2>

                    <input
                        type="text"
                        placeholder="Enter name"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-400 outline-none"
                    />

                    <button
                        onClick={() => {
                            if (newUserName.trim().length === 0) return;
                            setModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Create
                    </button>
                </div>
            </div>

            {/* ===========================================================
              User Edit Modal (Reusable for editing or creation)
            =========================================================== */}
            {isModalOpen && (
                <EditUserModal
                    open={isModalOpen}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </Card>
    );
}
