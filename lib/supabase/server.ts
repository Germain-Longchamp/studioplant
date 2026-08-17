import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Cette erreur peut être ignorée si on est dans un Server Component
            // (on ne peut pas set de cookies depuis un composant serveur, 
            // c'est le middleware qui s'en charge)
          }
        },
      },
    }
  );
}

// Mémoïse la vérification d'utilisateur pour la durée d'une seule requête/rendu.
// Sans ça, chaque Server Component ou Server Action qui vérifie l'authentification
// refait son propre aller-retour réseau vers Supabase Auth — une fiche plante en
// cumule jusqu'à 5 (page + 3 fetchs en parallèle), même si le middleware vient de
// le faire quelques millisecondes avant. React `cache()` déduplique ces appels au
// sein d'un même rendu serveur : un seul aller-retour réel, tous les autres appels
// réutilisent le résultat instantanément. Ne traverse pas les requêtes (pas de fuite
// entre utilisateurs) ni les runtimes (le middleware, en Edge, reste séparé).
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});