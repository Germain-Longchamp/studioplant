import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlantsClient from "./PlantsClient";

export default async function PlantsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const initialUrgentOnly = filter === "to-water";

  const supabase = await createClient();
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Les deux requêtes sont indépendantes (rooms ne dépend pas de plants) : on les
  // lance en parallèle au lieu de les attendre l'une après l'autre.
  const [{ data: plants }, { data: userRooms }] = await Promise.all([
    supabase
      .from("plants")
      .select("*")
      .eq("is_deceased", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("rooms")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <PlantsClient
      key={initialUrgentOnly ? "urgent" : "all"}
      initialUrgentOnly={initialUrgentOnly}
      plants={plants || []}
      userRooms={userRooms || []}
    />
  );
}