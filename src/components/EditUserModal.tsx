"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import Modal from "@/components/Modal";
import AvatarPicker from "@/components/AvatarPicker";

interface EditUserModalProps {
    open: boolean;
    onClose: () => void;
}

export default function EditUserModal({ open, onClose }: EditUserModalProps) {
    const { user, updateUserField } = useUser();

    // 👇 Hooks MUST always run, even if user is null
    const [name, setName] = useState(() => user?.name ?? "");
    const [avatar, setAvatar] = useState(() => user?.avatarUrl ?? "");

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Edit User"
            footer={
                <>
                    <button
                        className="px-3 py-2 bg-gray-200 rounded-lg"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        onClick={() => {
                            updateUserField("name", name);
                            updateUserField("avatarUrl", avatar);
                            onClose();
                        }}
                    >
                        Save
                    </button>
                </>
            }
        >
            <div className="space-y-4">
                <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Display name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />

                <AvatarPicker value={avatar} onChange={setAvatar} />
            </div>
        </Modal>
    );
}
