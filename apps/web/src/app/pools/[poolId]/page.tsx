import PoolPageClient from "./PoolPageClient";

// Generate static params for static export
// Returns empty array since data is fetched client-side at runtime
export async function generateStaticParams() {
  return [];
}

// Disable dynamic params since we handle this client-side
export const dynamicParams = false;

export default function PoolPage() {
  return <PoolPageClient />;
}
