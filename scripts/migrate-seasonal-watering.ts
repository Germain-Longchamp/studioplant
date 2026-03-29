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

    -> Prends IMPÉRATIVEMENT ce contexte global et les caractéristiques de ces pièces en compte pour tes analyses et tes choix de fréquences d'arrosage.
  `;
}

async function main() {
  console.log("🌿 Démarrage de la migration des fréquences saisonnières...\n");

  const { data: plants, error } = await supabaseAdmin
    .from("plants")
    .select("*")
    .is("watering_freq_spring", null);

  if (error) {
    console.error("❌ Impossible de récupérer les plantes :", error.message);
    process.exit(1);
  }

  if (!plants || plants.length === 0) {
    console.log("✅ Toutes les plantes ont déjà leurs fréquences saisonnières.");
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
      // Récupérer la ville de l'utilisateur
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(plant.user_id);
      const city = user?.user_metadata?.city;

      const contextPrompt = await getUserContextPrompt(plant.user_id, city);

      const prompt = `
Tu es un expert en botanique. Donne-moi les fréquences d'arrosage saisonnières (en nombre de jours entre chaque arrosage) pour cette plante d'intérieur :

- Nom : "${plant.name}"
- Espèce : "${plant.species || "Non précisée"}"
- Pièce : "${plant.room || "Non précisé"}"
- Exposition : "${plant.exposure || "Non précisée"}"

${contextPrompt}

Adapte les fréquences aux caractéristiques de la pièce (température été/hiver, humidité, orientation) et aux besoins spécifiques de l'espèce. En été les plantes ont généralement besoin de plus d'eau (fréquence plus courte). En hiver elles sont souvent en dormance (fréquence plus longue).

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks) :
{
  "watering_freq_spring": nombre_entier,
  "watering_freq_summer": nombre_entier,
  "watering_freq_autumn": nombre_entier,
  "watering_freq_winter": nombre_entier
}
      `;

      const result = await model.generateContent(prompt);
      const cleanedText = result.response
        .text()
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const data = JSON.parse(cleanedText);

      const { spring, summer, autumn, winter } = {
        spring: data.watering_freq_spring,
        summer: data.watering_freq_summer,
        autumn: data.watering_freq_autumn,
        winter: data.watering_freq_winter,
      };

      if (!spring || !summer || !autumn || !winter) {
        throw new Error("Valeurs manquantes dans la réponse JSON");
      }

      await supabaseAdmin.from("plants").update({
        watering_freq_spring: spring,
        watering_freq_summer: summer,
        watering_freq_autumn: autumn,
        watering_freq_winter: winter,
      }).eq("id", plant.id);

      console.log(`${index} ✅ ${plant.name} → 🌸${spring}j ☀️${summer}j 🍂${autumn}j ❄️${winter}j`);
      successCount++;
    } catch (err: any) {
      console.log(`${index} ❌ ${plant.name} → ${err.message}`);
      failures.push({ name: plant.name, id: plant.id });
    }

    // Délai anti-rate-limit (sauf après la dernière plante)
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
