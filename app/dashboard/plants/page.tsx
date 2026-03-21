import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlantsClient from "./PlantsClient";

export default async function PlantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 1. On récupère toutes les plantes
  const { data: plants } = await supabase
    .from("plants")
    .select("*")
    .order("created_at", { ascending: false });

  // 2. 🟢 On récupère les pièces configurées par l'utilisateur
  const { data: userRooms } = await supabase
    .from("rooms")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // On passe les deux tableaux au composant client
  return <PlantsClient plants={plants || []} userRooms={userRooms || []} />;
}