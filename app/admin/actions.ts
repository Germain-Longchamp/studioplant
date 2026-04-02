"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function assertAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  if (user.app_metadata?.role !== "admin") throw new Error("Accès refusé");
  return user;
}

async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  metadata = {},
}: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await supabaseAdmin.from("admin_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}

export async function deleteUserAccount(userId: string) {
  try {
    const adminUser = await assertAdmin();

    const { data: targetUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const targetEmail = targetUserData?.user?.email;

    await supabaseAdmin.from("plants").delete().eq("user_id", userId);
    await supabaseAdmin.from("rooms").delete().eq("user_id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    await logAdminAction({
      adminId: adminUser.id,
      action: "delete_user",
      targetType: "user",
      targetId: userId,
      metadata: { email: targetEmail },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur de suppression :", error);
    return { error: error.message === "Accès refusé" ? "Accès refusé" : "Impossible de supprimer l'utilisateur." };
  }
}
