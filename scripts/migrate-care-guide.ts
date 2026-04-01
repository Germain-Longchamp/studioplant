import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const AI_MODEL = "gemini-2.5-flash";

async function getUserContextPrompt(userId: string, city?: string): Promise<string> {
  const { data: rooms } = await supabaseAdmin
    .from("rooms")
    .select("*")
    .eq("user_id", userId);

  let roomsStr = "";
  if (rooms && rooms.length > 0) {
    roomsStr =
      "PIÈCES CONFIGURÉES DANS LA MAISON DE L'UTILISATEUR :\n" +
      rooms
        .map(
          (r: any) =>
            `- Nom de l'emplacement : ${r.name} | Orientation : ${r.orientation || "Non précisée"} | Lumière globale : ${r.light_level || "Non précisée"} | Humidité : ${r.humidity || "Non précisée"} | Temp. Été : ${r.temp_summer ? r.temp_summer + "°C" : "Non précisée"} | Temp. Hiver : ${r.temp_winter ? r.temp_winter + "°C" : "Non précisée"}`
        )
        .join("\n");
  } else {
    roomsStr = "L'utilisateur n'a pas encore configuré de pièces spécifiques.";
  }

  return `
    CONTEXTE GLOBAL DU DOMICILE :
    - Ville/Climat (Région) : ${city || "Non précisé"}

    ${roomsStr}

    -> Prends IMPÉRATIVEMENT ce contexte global et les caractéristiques de ces pièces en compte pour tes analyses et tes conseils d'entretien.
  `;
}

async function main() {
  console.log("🌿 Démarrage de la migration du guide d'entretien structuré...\n");

  const { data: plants, error } = await supabaseAdmin
    .from("plants")
    .select("*")
    .is("light_care", null);

  if (error) {
    console.error("❌ Impossible de récupérer les plantes :", error.message);
    process.exit(1);
  }

  if (!plants || plants.length === 0) {
    console.log("✅ Toutes les plantes ont déjà leur guide d'entretien structuré.");
    return;
  }

  console.log(`📋 ${plants.length} plante(s) à migrer.\n`);

  const model = genAI.getGenerativeModel({ model: AI_MODEL });
  const failures: { name: string; id: string }[] = [];
  let successCount = 0;

  for (let i = 0; i < plants.length; i++) {
    const plant = plants[i];
    const index = `[${i + 1}/${plants.length}]`;

    try {
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(plant.user_id);
      const city = user?.user_metadata?.city;

      const contextPrompt = await getUserContextPrompt(plant.user_id, city);

      const prompt = `
Tu es un expert en botanique. Génère un guide d'entretien structuré pour cette plante d'intérieur :

- Nom : "${plant.name}"
- Espèce : "${plant.species || "Non précisée"}"
- Pièce : "${plant.room || "Non précisé"}"
- Exposition : "${plant.exposure || "Non précisée"}"

${contextPrompt}

Adapte tous les conseils aux caractéristiques de la pièce (température été/hiver, humidité, orientation) et aux besoins spécifiques de l'espèce.

RÈGLE ABSOLUE : N'utilise JAMAIS de guillemets doubles (") à l'intérieur de tes textes (remplace par des guillemets simples).

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks) :
{
  "light_care": {
    "summary": "Résumé en 5-8 mots max de l'exposition lumineuse idéale (ex: 'Lumière vive indirecte')",
    "detail": "Conseil détaillé en 2-3 phrases. Où placer la plante, quelle orientation, quoi éviter, et les signes de manque ou excès de lumière. Adapte à la pièce et luminosité de l'utilisateur."
  },
  "watering_care": {
    "summary": "Résumé en 5-8 mots max de la stratégie d'arrosage (ex: 'Laisser sécher entre les arrosages')",
    "detail": "Conseil détaillé en 2-3 phrases. Fréquence selon la saison, méthode, température de l'eau, gestion de la soucoupe, test du doigt. Adapte à la pièce."
  },
  "substrate_care": {
    "summary": "Résumé en 5-8 mots max du substrat recommandé (ex: 'Terreau léger et drainant')",
    "detail": "Conseil détaillé en 2-3 phrases. Composition idéale avec proportions, fréquence de rempotage, meilleure période, taille du pot."
  },
  "seasonal_care": {
    "summary": "Résumé en 5-8 mots max de l'entretien récurrent (ex: 'Engrais de mars à septembre')",
    "detail": "Conseil détaillé en 2-3 phrases. Programme d'engrais, taille et nettoyage des feuilles, brumisation, gestes saisonniers spécifiques."
  }
}
      `;

      const result = await model.generateContent(prompt);
      const cleanedText = result.response
        .text()
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const data = JSON.parse(cleanedText);

      if (!data.light_care?.summary || !data.watering_care?.summary || !data.substrate_care?.summary || !data.seasonal_care?.summary) {
        throw new Error("Champs manquants dans la réponse JSON");
      }

      await supabaseAdmin.from("plants").update({
        light_care: data.light_care,
        watering_care: data.watering_care,
        substrate_care: data.substrate_care,
        seasonal_care: data.seasonal_care,
      }).eq("id", plant.id);

      console.log(`${index} ✅ ${plant.name} → ☀️ ${data.light_care.summary} | 💧 ${data.watering_care.summary}`);
      successCount++;
    } catch (err: any) {
      console.log(`${index} ❌ ${plant.name} → ${err.message}`);
      failures.push({ name: plant.name, id: plant.id });
    }

    if (i < plants.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  console.log("\n=== Migration terminée ===");
  console.log(`✅ Succès : ${successCount}/${plants.length}`);
  console.log(`❌ Échecs : ${failures.length}/${plants.length}`);
  if (failures.length > 0) {
    console.log(
      "Plantes en échec :",
      failures.map((f) => `${f.name} (id: ${f.id})`).join(", ")
    );
  }
}

main();
