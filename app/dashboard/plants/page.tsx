import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlantsClient from "./PlantsClient";

export default async function PlantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // On récupère toutes les plantes pour la bibliothèque (Index complet)
  const { data: plants } = await supabase
    .from("plants")
    .select("*")
    .order("created_at", { ascending: false });

  return <PlantsClient plants={plants || []} />;
}
