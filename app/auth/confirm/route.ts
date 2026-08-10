import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Route dédiée aux liens de confirmation par email (mot de passe oublié, etc.).
// Contrairement à /auth/callback (flow PKCE avec `code`, qui nécessite que le lien
// soit ouvert dans le MÊME navigateur que celui ayant initié la demande), cette route
// utilise token_hash + verifyOtp : aucun état stocké côté navigateur n'est requis,
// donc le lien fonctionne même ouvert depuis une autre appli/navigateur (cas normal
// pour un email consulté sur mobile).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  // Lien invalide, déjà utilisé ou expiré
  redirectTo.pathname = "/";
  redirectTo.searchParams.set("error", "Lien_invalide");
  return NextResponse.redirect(redirectTo);
}
