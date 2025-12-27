
import type { Metadata } from "next";
import FriendsContent from "@/components/FriendsContent";


export const metadata: Metadata = {
  title: "Amis",
};

export default function FriendsPage() {
  return <FriendsContent />;
}