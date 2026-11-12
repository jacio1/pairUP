import { ListingDetails } from "@/components/listings/listing-details";
export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ListingDetails id={id} />;
}
