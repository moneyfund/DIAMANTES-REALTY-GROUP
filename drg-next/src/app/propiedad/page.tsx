import { redirect } from "next/navigation";

export default async function LegacyPropertyRoute({
  searchParams
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const params = await searchParams;
  const value = Array.isArray(params.id) ? params.id[0] : params.id;

  if (value) redirect(`/propiedad/${encodeURIComponent(value)}`);
  redirect("/propiedades");
}
