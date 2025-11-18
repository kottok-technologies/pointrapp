import {motion} from "framer-motion";
import Image from "next/image";
import { useUser } from "@/context/UserContext"
import { Card } from "@/components/Card";


export default function UserSelectionCard() {
    const { user } = useUser();

    return (
        <Card>
            <>
            </>
        </Card>
    )
}