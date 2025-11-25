"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import AvatarPicker from "@/components/modals/AvatarPicker";
import { useModal } from "@/context/ModalContext";

export default function EditUserModal() {
    const { user, updateUserField, deleteUser } = useUser();
    const { closeModal } = useModal();

    const [name, setName] = useState(user?.name ?? "");
    const [avatar, setAvatar] = useState(user?.avatarUrl ?? "");

    if (!user) return null;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Edit User</h2>

            <div className="space-y-4 mb-6">
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <AvatarPicker value={avatar} onChange={(u) => setAvatar(u ?? "")} />
            </div>

            <div className="flex justify-between items-center">
                <button
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    onClick={() => {
                        deleteUser(user.id);
                        closeModal();
                    }}
                >
                    Delete
                </button>

                <div className="flex gap-3">
                    <button
                        className="px-3 py-2 bg-gray-200 rounded-lg"
                        onClick={closeModal}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        onClick={() => {
                            updateUserField("name", name);
                            updateUserField("avatarUrl", avatar);
                            closeModal();
                        }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
