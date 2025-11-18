"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";

export default function EditUserModal({
                                          initialName = "",
                                          onClose,
                                      }: {
    initialName?: string;
    onClose: () => void;
}) {
    const { createUser } = useUser();
    const [name, setName] = useState(initialName);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-10">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
                <h2 className="text-lg font-semibold mb-4">User Details</h2>

                <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                    placeholder="Display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <div className="flex justify-end gap-3">
                    <button
                        className="px-4 py-2 bg-gray-200 rounded-lg"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        onClick={async () => {
                            if (!name.trim()) return;
                            await createUser(name);
                            onClose();
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
