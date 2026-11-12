import { MyListings } from "@/components/product-pages";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ published?: string | string[] }>;
}) {
  const { published } = await searchParams;
  return (
    <MyListings
      publishedId={typeof published === "string" ? published : undefined}
    />
  );
}
