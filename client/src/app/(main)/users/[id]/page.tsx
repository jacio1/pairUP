import { PublicProfilePage } from "@/components/profile/public-profile";
export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicProfilePage id={id} />;
}
