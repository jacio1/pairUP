import { notFound, redirect } from "next/navigation";
import { ChatRoom } from "@/components/chat-room";
export default async function Conversation({
  params,
}: {
  params: Promise<{ userMessage: string }>;
}) {
  const { userMessage } = await params;
  if (userMessage === "demo") redirect("/messages/study-group");
  if (userMessage !== "study-group") notFound();
  return <ChatRoom />;
}
