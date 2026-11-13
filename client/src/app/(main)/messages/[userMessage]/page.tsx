import { RoomAccess } from "@/components/chat/room-access";
export default async function Conversation({
  params,
}: {
  params: Promise<{ userMessage: string }>;
}) {
  const { userMessage } = await params;
  return <RoomAccess roomId={userMessage} />;
}
