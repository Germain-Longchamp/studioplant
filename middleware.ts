import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // 1. On prépare la réponse par défaut (continuer la requête)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. On configure le client Supabase pour ce middleware
  // C'est nécessaire pour lire/écrire les cookies de session et rafraîchir le token si besoin
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // On met à jour les cookies dans la requête ET la réponse
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. On vérifie l'utilisateur (cela rafraîchit le token automatiquement si expiré)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- RÈGLES DE REDIRECTION ---

  // Règle A : Si l'utilisateur n'est PAS connecté et veut aller sur le Dashboard
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    // Hop, direction le login
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Règle B : Si l'utilisateur EST connecté et essaie d'aller sur la page de Login ou Auth
  // Exceptions : /auth/reset-password (session de récupération, doit rester accessible pour
  // choisir un nouveau mot de passe) et /auth/confirm (le lien de confirmation par email doit
  // pouvoir aboutir même si l'utilisateur est déjà connecté dans ce navigateur, sinon il est
  // renvoyé au dashboard avant que verifyOtp n'ait eu la chance de s'exécuter).
  const AUTH_PATHS_EXEMPT_WHEN_LOGGED_IN = ["/auth/reset-password", "/auth/confirm"];
  if (
    user &&
    request.nextUrl.pathname.startsWith("/auth") &&
    !AUTH_PATHS_EXEMPT_WHEN_LOGGED_IN.includes(request.nextUrl.pathname)
  ) {
    // Pas besoin de se reconnecter, direction le dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Si aucune redirection n'est nécessaire, on laisse passer
  return response;
}

// Configuration pour dire à Next.js sur quelles routes exécuter ce middleware
export const config = {
  matcher: [
    /*
     * Exclure les fichiers statiques, les images, etc.
     * On ne veut pas lancer Supabase quand le navigateur charge le logo ou le CSS.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};