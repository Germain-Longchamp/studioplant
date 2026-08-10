import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // hasSession distingue une arrivée légitime via le lien de récupération
  // d'une navigation directe sans session valide (lien expiré, déjà utilisé, etc.)
  return <ResetPasswordForm hasSession={!!user} />;
}
