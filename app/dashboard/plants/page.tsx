import { createClient } from "@/lib/supabase/server";
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: plants } = await supabase
    .from("plants")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: userRooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <PlantsClient
      key={initialUrgentOnly ? "urgent" : "all"}
      initialUrgentOnly={initialUrgentOnly}
      plants={plants || []}
      userRooms={userRooms || []}
    />
  );
}