"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// 🔴 INITIALISATION DU CLIENT ADMIN (Bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function deleteUserAccount(userId: string) {
  try {
    // 1. Supprimer les plantes et pièces de l'utilisateur (optionnel si tu as ON DELETE CASCADE sur ta BDD)
    await supabaseAdmin.from("plants").delete().eq("user_id", userId);
    // Remplace "user_rooms" par le nom exact de ta table de pièces si besoin
    await supabaseAdmin.from("user_rooms").delete().eq("user_id", userId);

    // 2. Supprimer l'utilisateur de l'authentification Supabase
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) throw error;

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur de suppression :", error);
    return { error: "Impossible de supprimer l'utilisateur." };
  }
}