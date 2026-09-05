"use server";

import { createClient, getAuthenticatedUser } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { GrowthPhoto } from "@/lib/types";
import {
  getAstronomicalSeason,
  getSeasonFrequency,
  getEffectiveSeason,
  SEASON_LABEL_FR,
  type Season,
} from "@/lib/utils";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// MODÈLE IA
const AI_MODEL = "gemini-2.5-flash";


// ==========================================
// 🟢 GÉNÉRATEUR DE SUPER CONTEXTE (CORRIGÉ - FAILLE 1)
// ==========================================
async function getUserContextPrompt(user: any) {
  const supabase = await createClient();
  const meta = user.user_metadata || {};

  // Récupération des pièces de l'utilisateur
  const { data: rooms } = await supabase.from("rooms").select("*").eq("user_id", user.id);

  let roomsStr = "";
  if (rooms && rooms.length > 0) {
    roomsStr = "PIÈCES CONFIGURÉES DANS LA MAISON DE L'UTILISATEUR :\n" + rooms.map((r: any) =>
      `- Nom de l'emplacement : ${r.name} | Orientation : ${r.orientation || 'Non précisée'} | Lumière globale : ${r.light_level || 'Non précisée'} | Humidité : ${r.humidity || 'Non précisée'} | Temp. Été : ${r.temp_summer ? r.temp_summer+'°C' : 'Non précisée'} | Temp. Hiver : ${r.temp_winter ? r.temp_winter+'°C' : 'Non précisée'}`
    ).join('\n');
  } else {
    roomsStr = "L'utilisateur n'a pas encore configuré de pièces spécifiques.";
  }

  // On renvoie le prompt indépendamment du fait que la région soit remplie ou non
  return `
    CONTEXTE GLOBAL DU DOMICILE :
    - Ville/Climat (Région) : ${meta.city || 'Non précisé'}
    
    ${roomsStr}
    
    -> Prends IMPÉRATIVEMENT ce contexte global et les caractéristiques de ces pièces en compte pour tes analyses, tes conseils d'entretien et tes choix de substrats/matériels.
  `;
}



// ==========================================
// 🟢 PRÉ-ANALYSE RAPIDE (ÉTAPE 1 - MULTI-PIÈCES)
// ==========================================
export async function analyzePlantForForm(formData: FormData) {
  const imageFile = formData.get("image") as File;
  if (!imageFile || imageFile.size === 0) return { error: "Aucune image fournie." };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    // On récupère toutes les infos des pièces pour que l'IA puisse juger (température, humidité, etc.)
    const { data: rooms } = await supabase.from("rooms").select("*").eq("user_id", user.id);
    let roomsStr = "L'utilisateur n'a configuré aucune pièce.";
    if (rooms && rooms.length > 0) {
      roomsStr = rooms.map(r => 
        `- Nom: ${r.name} | Orientation: ${r.orientation || 'N/A'} | Lumière: ${r.light_level || 'N/A'} | Humidité: ${r.humidity || 'N/A'} | Temp: Été ${r.temp_summer || 'N/A'}°C, Hiver ${r.temp_winter || 'N/A'}°C`
      ).join('\n');
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const imagePart = { inlineData: { data: base64Data, mimeType: imageFile.type } };

    // thinkingBudget: 0 — désactive le mode "réflexion" de Gemini 2.5 Flash, qui peut
    // faire dépasser le temps d'exécution de la Server Action (même correctif que sur
    // le Docteur Plante, qui provoquait exactement ce genre de timeout silencieux).
    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as any,
    });

    const prompt = `
      Analyse cette photo pour identifier la plante d'intérieur.
      Voici les pièces disponibles chez l'utilisateur et leurs caractéristiques : 
      ${roomsStr}

      Parmi cette liste exacte de pièces, détermine s'il y en a une ou plusieurs qui conviendraient parfaitement à cette plante.

      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown) :
      {
        "name": "Nom commun (ex: Monstera Deliciosa)",
        "species": "Nom scientifique",
        "recommended_rooms": [
          {
            "room_name": "Le nom exact de la pièce (ex: Salon)",
            "reason": "Justification TRÈS courte (1 phrase max). Ex: Car cette pièce est lumineuse et humide."
          }
        ]
      }
      S'il n'y a aucune pièce configurée, ou si aucune ne correspond vraiment, renvoie un tableau "recommended_rooms" vide [].
      Si l'image ne montre pas de plante, retourne : {"name": "Erreur", "species": "Non reconnu", "recommended_rooms": []}
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanedText);

    if (data.name === "Erreur") return { error: "Nous n'avons pas réussi à identifier de plante sur cette photo." };

    return { success: true, data };
  } catch (error) {
    console.error("Pre-analysis Error:", error);
    return { error: "Impossible d'analyser la photo pour le moment." };
  }
}

// ==========================================
// AJOUT FINAL
// ==========================================
export async function addPlantWithAI(formData: FormData) {
  const imageFile = formData.get("image") as File;
  const room = formData.get("room") as string;
  const light = formData.get("light") as string;
  
  // Données pré-remplies de l'étape 1
  const prefilledName = formData.get("prefilled_name") as string;
  const prefilledSpecies = formData.get("prefilled_species") as string;
  
  const lastWateredInput = formData.get("lastWateredAt") as string;
  const lastWateredDate = lastWateredInput 
    ? new Date(lastWateredInput).toISOString() 
    : new Date().toISOString();

  if (!imageFile || imageFile.size === 0) return { error: "Aucune image fournie." };

  let newPlantId: string | null = null;
  let fileName: string | undefined;
  let supabase: Awaited<ReturnType<typeof createClient>> | undefined;

  try {
    supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const contextPrompt = await getUserContextPrompt(user);
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

    // 🚀 OPTIMISATION 1 : On prépare l'upload de l'image (Tâche A)
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    const uploadPromise = supabase.storage.from("plant-images").upload(fileName, imageFile);

    // 🚀 OPTIMISATION 2 : On prépare l'appel à Gemini (Tâche B)
    let geminiPromise;

    if (prefilledName && prefilledSpecies) {
      // MODE ULTRA RAPIDE : On ne renvoie pas l'image, on utilise juste le texte !
      const textPrompt = `
        Tu es un expert en botanique. L'utilisateur vient d'ajouter cette plante à sa collection :
        Nom : "${prefilledName}"
        Espèce : "${prefilledSpecies}"
        
        Il a décidé de la placer dans cette pièce précise (qui fait partie de sa maison) : "${room || "Non précisé"}".
        La luminosité locale de cet emplacement précis est : "${light || "Non précisée"}".

        ${contextPrompt}

        IMPORTANT pour les fréquences d'arrosage : donne 4 valeurs différentes selon les saisons. En été les plantes ont généralement besoin de plus d'eau (fréquence plus courte). En hiver elles sont en dormance (fréquence plus longue). Adapte ces valeurs aux caractéristiques de la pièce (température été/hiver, humidité) et à l'espèce.

        Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
        {
          "name": "${prefilledName}",
          "species": "${prefilledSpecies}",
          "watering_freq_spring": nombre_entier_en_jours,
          "watering_freq_summer": nombre_entier_en_jours,
          "watering_freq_autumn": nombre_entier_en_jours,
          "watering_freq_winter": nombre_entier_en_jours,
          "origin": "Origine géographique (ex: Forêts tropicales d'Am. du Sud)",
          "robustness": "Note et petit comm. (ex: 8/10 - Pardonne les oublis)",
          "robustness_score": "Uniquement la note chiffrée, ex: 9/10",
          "max_size": "Taille maximale en intérieur (ex: Jusqu'à 3m)",
          "max_size_short": "Uniquement la valeur courte avec unité, ex: 2–3 m",
          "ideal_substrate": "Substrat idéal (ex: Terreau léger et drainant)",
          "ideal_exposure": "Exposition idéale (ex: Lumière vive sans soleil direct)",
          "room_advice": "Ton avis d'expert court sur le choix de cette pièce en tenant compte de ses températures, son orientation et son humidité.",
          "light_advice": "Ton avis d'expert court sur la luminosité locale choisie.",
          "light_care": { "summary": "Résumé en 5-8 mots max de l'exposition lumineuse idéale (ex: 'Lumière vive indirecte')", "detail": "Conseil détaillé en 2-3 phrases. Où placer la plante, quelle orientation, quoi éviter, et les signes de manque ou excès de lumière. Adapte à la pièce et luminosité de l'utilisateur." },
          "watering_care": { "summary": "Résumé en 5-8 mots max de la stratégie d'arrosage (ex: 'Laisser sécher entre les arrosages')", "detail": "Conseil détaillé en 2-3 phrases. Fréquence selon la saison, méthode, température de l'eau, gestion de la soucoupe, test du doigt. Adapte à la pièce." },
          "substrate_care": { "summary": "Résumé en 5-8 mots max du substrat recommandé (ex: 'Terreau léger et drainant')", "detail": "Conseil détaillé en 2-3 phrases. Composition idéale avec proportions, fréquence de rempotage, meilleure période, taille du pot." },
          "seasonal_care": { "summary": "Résumé en 5-8 mots max de l'entretien récurrent (ex: 'Engrais de mars à septembre')", "detail": "Conseil détaillé en 2-3 phrases. Programme d'engrais, taille et nettoyage des feuilles, brumisation, gestes saisonniers spécifiques." }
        }
      `;
      geminiPromise = model.generateContent(textPrompt);
    } else {
      // MODE CLASSIQUE (Fallback si on n'a pas les données de l'étape 1 pour une raison X ou Y)
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString("base64");
      const imagePart = { inlineData: { data: base64Data, mimeType: imageFile.type } };

      const multimodalPrompt = `
        Analyse cette photo de plante d'intérieur. 
        L'utilisateur a décidé de la placer dans cette pièce précise : "${room || "Non précisé"}".
        La luminosité locale est : "${light || "Non précisée"}".

        ${contextPrompt}

        IMPORTANT pour les fréquences d'arrosage : donne 4 valeurs différentes selon les saisons. En été les plantes ont généralement besoin de plus d'eau (fréquence plus courte). En hiver elles sont en dormance (fréquence plus longue). Adapte ces valeurs aux caractéristiques de la pièce (température été/hiver, humidité) et à l'espèce.

        RÈGLE ABSOLUE : N'utilise JAMAIS de guillemets doubles (") à l'intérieur de tes textes (remplace par des guillemets simples).
        Retourne UNIQUEMENT un JSON avec la structure : {"name": "...", "species": "...", "watering_freq_spring": 7, "watering_freq_summer": 7, "watering_freq_autumn": 7, "watering_freq_winter": 7, "origin": "...", "robustness": "...", "robustness_score": "...", "max_size": "...", "max_size_short": "...", "ideal_substrate": "...", "ideal_exposure": "...", "room_advice": "...", "light_advice": "...", "light_care": {"summary": "...", "detail": "..."}, "watering_care": {"summary": "...", "detail": "..."}, "substrate_care": {"summary": "...", "detail": "..."}, "seasonal_care": {"summary": "...", "detail": "..."}}
        Si ce n'est pas une plante, retourne : {"name": "Erreur", "species": "Non reconnu"}
      `;
      geminiPromise = model.generateContent([multimodalPrompt, imagePart]);
    }

    // 🚀 OPTIMISATION 3 : On lance Tâche A et Tâche B EXACTEMENT EN MÊME TEMPS
    const [uploadResult, geminiResult] = await Promise.all([uploadPromise, geminiPromise]);

    // Vérification de l'upload
    if (uploadResult.error) return { error: "Erreur lors de la sauvegarde de l'image." };

    // Vérification et formatage du résultat IA
    const cleanedText = geminiResult.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    let plantData;
    try {
      plantData = JSON.parse(cleanedText);
    } catch (e) {
      return { error: "Le laboratoire a eu du mal à rédiger la fiche. Veuillez réessayer." };
    }

    if (plantData.name === "Erreur") {
      await supabase.storage.from("plant-images").remove([fileName]);
      return { error: "Nous n'avons pas réussi à identifier de plante sur cette photo." };
    }

    // Récupération de l'URL de l'image fraîchement uploadée
    const { data: publicUrlData } = supabase.storage.from("plant-images").getPublicUrl(fileName);

    // Sauvegarde en base de données
    const { data: newPlant, error: dbError } = await supabase.from("plants").insert({
      user_id: user.id,
      name: plantData.name,
      species: plantData.species,
      watering_freq_spring: plantData.watering_freq_spring,
      watering_freq_summer: plantData.watering_freq_summer,
      watering_freq_autumn: plantData.watering_freq_autumn,
      watering_freq_winter: plantData.watering_freq_winter,
      // US-002/US-003 : intervalle promis figé dès la création, à partir de la
      // cadence de la saison EFFECTIVE du compte (pas forcément le mois calendaire :
      // un utilisateur ayant refusé un changement de saison reste sur son ancienne
      // saison tant qu'il n'accepte pas). Déjà connue à cet instant, contrairement
      // à saveOptimisticPlant où la génération est différée.
      promised_watering_interval_days: getSeasonFrequency(plantData, getEffectiveSeason(user)),
      exposure: light,
      room: room,
      description: "", 
      origin: plantData.origin,
      robustness: plantData.robustness,
      robustness_score: plantData.robustness_score,
      max_size: plantData.max_size,
      max_size_short: plantData.max_size_short,
      ideal_substrate: plantData.ideal_substrate,
      ideal_exposure: plantData.ideal_exposure,
      light_care: plantData.light_care,
      watering_care: plantData.watering_care,
      substrate_care: plantData.substrate_care,
      seasonal_care: plantData.seasonal_care,
      room_advice: plantData.room_advice,
      light_advice: plantData.light_advice,
      image_path: publicUrlData.publicUrl,
      last_watered_at: lastWateredDate,
      watering_history: [lastWateredDate],
      snooze_days: 0,
    }).select().single();

    if (dbError) throw dbError;
    newPlantId = newPlant.id;

    revalidatePath("/dashboard");
    return { success: true, plantId: newPlantId };

  } catch (error) {
    console.error("Unexpected Error:", error);
    if (fileName && supabase) {
      try { await supabase.storage.from("plant-images").remove([fileName]); } catch { /* ignore */ }
    }
    return { error: "Une erreur inattendue est survenue." };
  }
}

// ==========================================
// 🟢 ÉTAPE 2 : SAUVEGARDE ÉCLAIR (SANS IA)
// ==========================================
export async function saveOptimisticPlant(formData: FormData) {
  const imageFile = formData.get("image") as File;
  const room = formData.get("room") as string;
  const light = formData.get("light") as string;
  const prefilledName = formData.get("prefilled_name") as string;
  const prefilledSpecies = formData.get("prefilled_species") as string;
  const lastWateredInput = formData.get("lastWateredAt") as string;

  if (!imageFile) return { error: "Aucune image fournie." };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const lastWateredDate = lastWateredInput ? new Date(lastWateredInput).toISOString() : new Date().toISOString();

    // 1. Upload de l'image (Seule tâche asynchrone, très rapide)
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    const { error: storageError } = await supabase.storage.from("plant-images").upload(fileName, imageFile);
    if (storageError) return { error: "Erreur lors de la sauvegarde de l'image." };

    const { data: publicUrlData } = supabase.storage.from("plant-images").getPublicUrl(fileName);

    // 2. Sauvegarde en BDD (Immédiate) avec des champs VIDES pour la génération différée
    const { data: newPlant, error: dbError } = await supabase.from("plants").insert({
      user_id: user.id,
      name: prefilledName || "Plante inconnue",
      species: prefilledSpecies || "Espèce inconnue",
      // US-002 : intervalle promis, figé jusqu'au premier arrosage. Valeur d'attente
      // (la génération IA différée ne le touchera jamais, voir generateDeferredCareGuide) —
      // la vraie cadence saisonnière ne sera figée qu'au premier arrosage réel.
      promised_watering_interval_days: 7,
      exposure: light,
      room: room,
      description: "",
      image_path: publicUrlData.publicUrl,
      last_watered_at: lastWateredDate,
      watering_history: [lastWateredDate],
      snooze_days: 0,
      // 🟢 Les champs ci-dessous seront remplis par l'IA en arrière-plan :
      origin: "",
      robustness: "",
      robustness_score: "",
      max_size: "",
      max_size_short: "",
      ideal_substrate: "",
      ideal_exposure: "",
      light_care: null,
      watering_care: null,
      substrate_care: null,
      seasonal_care: null,
      room_advice: "",
      light_advice: ""
    }).select().single();

    if (dbError) throw dbError;

    revalidatePath("/dashboard");
    return { success: true, plantId: newPlant.id };
  } catch (error) {
    return { error: "Une erreur est survenue lors de la sauvegarde." };
  }
}

// ==========================================
// 🟢 ÉTAPE 3 (BACKGROUND) : GÉNÉRATION DU CARNET
// ==========================================
export async function generateDeferredCareGuide(plantId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    // On récupère la plante
    const { data: plant } = await supabase.from("plants").select("*").eq("id", plantId).single();
    if (!plant) return { error: "Plante introuvable" };

    const contextPrompt = await getUserContextPrompt(user);
    // thinkingBudget: 0 — même correctif que sur analyzePlantForForm/diagnosePlant,
    // pour éviter les timeouts silencieux liés au mode "réflexion" de Gemini 2.5 Flash.
    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as any,
    });

    // On demande à Gemini TOUT le reste, basé sur la pièce et l'espèce
    const prompt = `
      Tu es un expert en botanique. L'utilisateur vient d'ajouter cette plante à sa collection :
      Nom : "${plant.name}"
      Espèce : "${plant.species}"

      Il l'a placée dans cette pièce : "${plant.room || "Non précisé"}".
      La luminosité locale de cet emplacement est : "${plant.exposure || "Non précisée"}".

      ${contextPrompt}

      Génère son carnet de santé complet.
      IMPORTANT pour les fréquences d'arrosage : donne 4 valeurs différentes selon les saisons. En été les plantes ont généralement besoin de plus d'eau (fréquence plus courte). En hiver elles sont en dormance (fréquence plus longue). Adapte ces valeurs aux caractéristiques de la pièce (température été/hiver, humidité) et à l'espèce.

      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
      {
        "watering_freq_spring": nombre_entier_en_jours,
        "watering_freq_summer": nombre_entier_en_jours,
        "watering_freq_autumn": nombre_entier_en_jours,
        "watering_freq_winter": nombre_entier_en_jours,
        "origin": "Origine géographique (ex: Forêts tropicales d'Am. du Sud)",
        "robustness": "Note et petit comm. (ex: 8/10 - Pardonne les oublis)",
        "robustness_score": "Uniquement la note chiffrée, ex: 9/10",
        "max_size": "Taille maximale en intérieur (ex: Jusqu'à 3m)",
        "max_size_short": "Uniquement la valeur courte avec unité, ex: 2–3 m",
        "ideal_substrate": "Substrat idéal (ex: Terreau léger et drainant)",
        "ideal_exposure": "Exposition idéale (ex: Lumière vive sans soleil direct)",
        "room_advice": "Ton avis d'expert court sur le choix de cette pièce en tenant compte de ses températures, son orientation et son humidité.",
        "light_advice": "Ton avis d'expert court sur la luminosité locale choisie.",
        "light_care": { "summary": "Résumé en 5-8 mots max de l'exposition lumineuse idéale (ex: 'Lumière vive indirecte')", "detail": "Conseil détaillé en 2-3 phrases. Où placer la plante, quelle orientation, quoi éviter, et les signes de manque ou excès de lumière. Adapte à la pièce et luminosité de l'utilisateur." },
        "watering_care": { "summary": "Résumé en 5-8 mots max de la stratégie d'arrosage (ex: 'Laisser sécher entre les arrosages')", "detail": "Conseil détaillé en 2-3 phrases. Fréquence selon la saison, méthode, température de l'eau, gestion de la soucoupe, test du doigt. Adapte à la pièce." },
        "substrate_care": { "summary": "Résumé en 5-8 mots max du substrat recommandé (ex: 'Terreau léger et drainant')", "detail": "Conseil détaillé en 2-3 phrases. Composition idéale avec proportions, fréquence de rempotage, meilleure période, taille du pot." },
        "seasonal_care": { "summary": "Résumé en 5-8 mots max de l'entretien récurrent (ex: 'Engrais de mars à septembre')", "detail": "Conseil détaillé en 2-3 phrases. Programme d'engrais, taille et nettoyage des feuilles, brumisation, gestes saisonniers spécifiques." }
      }
    `;

    const result = await model.generateContent(prompt);
    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    let plantData;
    try {
      plantData = JSON.parse(cleanedText);
    } catch {
      return { error: "Erreur de format lors de la génération du carnet." };
    }

    // US-004 : on ne régénère les 4 cadences saisonnières que si la plante suit
    // les saisons (identique en résultat à l'ancien gating watering_frequency_custom
    // sur les données existantes, champ propre).
    const deferredFreqFields = plant.follows_seasons ? {
      watering_freq_spring: plantData.watering_freq_spring,
      watering_freq_summer: plantData.watering_freq_summer,
      watering_freq_autumn: plantData.watering_freq_autumn,
      watering_freq_winter: plantData.watering_freq_winter,
    } : {};

    // On met à jour la base de données avec les nouvelles infos
    const { error: updateError } = await supabase.from("plants").update({
      ...deferredFreqFields,
      origin: plantData.origin,
      robustness: plantData.robustness,
      robustness_score: plantData.robustness_score,
      max_size: plantData.max_size,
      max_size_short: plantData.max_size_short,
      ideal_substrate: plantData.ideal_substrate,
      ideal_exposure: plantData.ideal_exposure,
      light_care: plantData.light_care,
      watering_care: plantData.watering_care,
      substrate_care: plantData.substrate_care,
      seasonal_care: plantData.seasonal_care,
      room_advice: plantData.room_advice,
      light_advice: plantData.light_advice,
    }).eq("id", plantId);

    if (updateError) throw updateError;

    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("Deferred Generation Error:", error);
    return { error: "Erreur lors de la génération du carnet." };
  }
}


// AJUSTER LA FRÉQUENCE D'ARROSAGE MANUELLEMENT
// Bornes de cadence (US-004) : appliquées à la saisie directe ET aux 3 valeurs
// propagées proportionnellement. 90 j couvre une dormance hivernale extrême sans
// autoriser l'absurde ; le maximum réel du parc étant de 50 j, le plafond EST
// atteignable en usage normal (doubler une cadence d'hiver de 50 j).
const FREQ_MIN = 1;
const FREQ_MAX = 90;
const clampFreq = (n: number) => Math.max(FREQ_MIN, Math.min(FREQ_MAX, Math.round(n)));

export async function updateWateringFrequency(plantId: string, newFrequency: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const clamped = clampFreq(newFrequency);

    const { data: plant } = await supabase
      .from("plants")
      .select(
        "follows_seasons, watering_freq_spring, watering_freq_summer, watering_freq_autumn, watering_freq_winter"
      )
      .eq("id", plantId)
      .eq("user_id", user.id)
      .single();
    if (!plant) return { error: "Plante introuvable" };

    // US-002 : un réglage manuel fige immédiatement l'intervalle promis (recalcul
    // sans attendre le prochain arrosage — c'est une action délibérée, pas un
    // changement subi).
    let update: Record<string, number>;

    if (!plant.follows_seasons) {
      // US-004 : plus de forme saisonnière à préserver, la valeur s'applique telle quelle.
      update = { promised_watering_interval_days: clamped };
    } else {
      // US-004 : on ajuste la cadence de la saison EFFECTIVE du compte (US-003 :
      // pas forcément le mois calendaire), les 3 autres suivent proportionnellement.
      const effSeason = getEffectiveSeason(user);
      const seasonValues: Record<Season, number> = {
        spring: plant.watering_freq_spring,
        summer: plant.watering_freq_summer,
        autumn: plant.watering_freq_autumn,
        winter: plant.watering_freq_winter,
      };
      const oldActive = seasonValues[effSeason];

      if (!oldActive || oldActive <= 0) {
        // Dégénéré (aucune valeur de référence exploitable) : on aplatit les 4.
        update = {
          watering_freq_spring: clamped,
          watering_freq_summer: clamped,
          watering_freq_autumn: clamped,
          watering_freq_winter: clamped,
          promised_watering_interval_days: clamped,
        };
      } else {
        const ratio = clamped / oldActive;
        const scaled = (season: Season) =>
          season === effSeason ? clamped : clampFreq(seasonValues[season] * ratio);
        update = {
          watering_freq_spring: scaled("spring"),
          watering_freq_summer: scaled("summer"),
          watering_freq_autumn: scaled("autumn"),
          watering_freq_winter: scaled("winter"),
          promised_watering_interval_days: clamped,
        };
      }
    }

    const { error } = await supabase
      .from("plants")
      .update(update)
      .eq("id", plantId)
      .eq("user_id", user.id);
    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("updateWateringFrequency error:", error);
    return { error: "Impossible de mettre à jour la fréquence." };
  }
}

// US-004 : désactiver la saisonnalité d'une plante — cadence constante toute
// l'année (= l'intervalle promis actuel). Ne touche PAS promised_watering_interval_days
// (US-002 : l'échéance en cours n'est pas déplacée). Réversible via reactivateSeasonality.
// On maintient watering_frequency_custom en miroir (= !follows_seasons) le temps de la
// bascule : un rollback du déploiement retrouve ainsi un état cohérent.
export async function disableSeasonality(plantId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const { error } = await supabase
      .from("plants")
      .update({ follows_seasons: false, watering_frequency_custom: true })
      .eq("id", plantId)
      .eq("user_id", user.id);
    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("disableSeasonality error:", error);
    return { error: "Impossible de désactiver la saisonnalité." };
  }
}

// US-004 : réactiver la saisonnalité. Deux cas :
//  - les 4 cadences sont DÉGÉNÉRÉES (toutes égales — plante figée avant US-004,
//    valeurs d'origine perdues) → régénération IA obligatoire, l'appelant doit
//    avoir prévenu l'utilisateur (perte de la valeur manuelle).
//  - les 4 cadences sont INTACTES (plante désactivée via le nouveau réglage, qui
//    ne les efface pas) → simple bascule du drapeau, ni IA ni perte.
export async function reactivateSeasonality(plantId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const { data: plant } = await supabase
      .from("plants")
      .select("watering_freq_spring, watering_freq_summer, watering_freq_autumn, watering_freq_winter")
      .eq("id", plantId)
      .eq("user_id", user.id)
      .single();
    if (!plant) return { error: "Plante introuvable" };

    const degenerate =
      plant.watering_freq_spring === plant.watering_freq_summer &&
      plant.watering_freq_summer === plant.watering_freq_autumn &&
      plant.watering_freq_autumn === plant.watering_freq_winter;

    if (!degenerate) {
      const { error } = await supabase
        .from("plants")
        .update({ follows_seasons: true, watering_frequency_custom: false })
        .eq("id", plantId)
        .eq("user_id", user.id);
      if (error) throw error;
      revalidatePath("/dashboard");
      revalidatePath(`/dashboard/plant/${plantId}`);
      return { success: true, regenerated: false };
    }

    // On bascule le drapeau AVANT la régénération pour que le gating de
    // updatePlantAdvice (qui saute le recalcul saisonnier si follows_seasons=false)
    // laisse passer les 4 nouvelles valeurs.
    const { error: flagError } = await supabase
      .from("plants")
      .update({ follows_seasons: true, watering_frequency_custom: false })
      .eq("id", plantId)
      .eq("user_id", user.id);
    if (flagError) throw flagError;

    const advice = await updatePlantAdvice(plantId);
    if (advice?.error) {
      // Repli : ne jamais laisser une plante sans cadence exploitable.
      await supabase
        .from("plants")
        .update({ follows_seasons: false, watering_frequency_custom: true })
        .eq("id", plantId)
        .eq("user_id", user.id);
      return { error: "La régénération des cadences a échoué. Réessayez." };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true, regenerated: true };
  } catch (error) {
    console.error("reactivateSeasonality error:", error);
    return { error: "Impossible de réactiver la saisonnalité." };
  }
}

// METTRE EN PAUSE / REPRENDRE LES RAPPELS D'ARROSAGE
// Cas d'usage : plantes qui tolèrent très mal l'arrosage régulier (ex: ZZ plant),
// où même la fréquence la plus longue finit par redevenir "en retard". La pause
// n'affecte que les rappels (badges, notifications) — l'arrosage manuel reste possible.
export async function toggleRemindersPaused(plantId: string, paused: boolean) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();
    if (!user) return { error: "Non autorisé" };

    const { error } = await supabase
      .from("plants")
      .update({ reminders_paused: paused })
      .eq("id", plantId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/plants");
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("toggleRemindersPaused error:", error);
    return { error: "Impossible de mettre à jour les rappels." };
  }
}

export async function updatePlantAdvice(plantId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const { data: plant } = await supabase.from("plants").select("*").eq("id", plantId).single();
    if (!plant) return { error: "Plante introuvable" };

    // 🟢 Super Contexte
    const contextPrompt = await getUserContextPrompt(user);

    const prompt = `
      Tu es un expert en botanique. L'utilisateur souhaite mettre à jour les conseils d'entretien pour sa plante avec les données suivantes :
      - Nom commun : ${plant.name}
      - Espèce : ${plant.species}
      - Pièce actuelle de la plante : ${plant.room || "Non précisé"}
      - Exposition locale actuelle de la plante : ${plant.exposure || "Non précisée"}

      ${contextPrompt}

      Génère de nouveaux conseils adaptés en croisant les besoins de la plante avec les caractéristiques de la pièce où elle se trouve.
      
      RÈGLE ABSOLUE POUR LE FORMAT DE RÉPONSE :
      Retourne UNIQUEMENT un objet JSON valide. 
      N'utilise JAMAIS de guillemets doubles (") à l'intérieur de tes textes (remplace-les par des guillemets simples (') si besoin).
      N'ajoute AUCUNE balise markdown (pas de \`\`\`json) ni texte avant ou après.

      IMPORTANT pour les fréquences d'arrosage : donne 4 valeurs différentes selon les saisons. En été les plantes ont généralement besoin de plus d'eau (fréquence plus courte). En hiver elles sont en dormance (fréquence plus longue). Adapte ces valeurs aux caractéristiques de la pièce (température été/hiver, humidité) et à l'espèce.

      Structure exacte attendue :
      {
        "watering_freq_spring": nombre_entier_en_jours,
        "watering_freq_summer": nombre_entier_en_jours,
        "watering_freq_autumn": nombre_entier_en_jours,
        "watering_freq_winter": nombre_entier_en_jours,
        "origin": "Origine géographique (ex: Forêts tropicales d'Am. du Sud)",
        "robustness": "Note et petit comm. (ex: 8/10 - Pardonne les oublis)",
        "robustness_score": "Uniquement la note chiffrée, ex: 9/10",
        "max_size": "Taille maximale en intérieur (ex: Jusqu'à 3m)",
        "max_size_short": "Uniquement la valeur courte avec unité, ex: 2–3 m",
        "ideal_substrate": "Substrat idéal (ex: Terreau léger et drainant)",
        "ideal_exposure": "Exposition idéale (ex: Lumière vive sans soleil direct)",
        "room_advice": "Avis expert court sur la pièce choisie (température, humidité...)",
        "light_advice": "Avis expert court sur la lumière...",
        "light_care": { "summary": "Résumé en 5-8 mots max de l'exposition lumineuse idéale (ex: 'Lumière vive indirecte')", "detail": "Conseil détaillé en 2-3 phrases. Où placer la plante, quelle orientation, quoi éviter, et les signes de manque ou excès de lumière. Adapte à la pièce et luminosité de l'utilisateur." },
        "watering_care": { "summary": "Résumé en 5-8 mots max de la stratégie d'arrosage (ex: 'Laisser sécher entre les arrosages')", "detail": "Conseil détaillé en 2-3 phrases. Fréquence selon la saison, méthode, température de l'eau, gestion de la soucoupe, test du doigt. Adapte à la pièce." },
        "substrate_care": { "summary": "Résumé en 5-8 mots max du substrat recommandé (ex: 'Terreau léger et drainant')", "detail": "Conseil détaillé en 2-3 phrases. Composition idéale avec proportions, fréquence de rempotage, meilleure période, taille du pot." },
        "seasonal_care": { "summary": "Résumé en 5-8 mots max de l'entretien récurrent (ex: 'Engrais de mars à septembre')", "detail": "Conseil détaillé en 2-3 phrases. Programme d'engrais, taille et nettoyage des feuilles, brumisation, gestes saisonniers spécifiques." }
      }
    `;

    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent(prompt);
    
    // Nettoyage plus agressif au cas où
    let cleanedText = result.response.text()
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // 🟢 Sécurisation du Parsing JSON
    let plantData;
    try {
      plantData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("ERREUR PARSING JSON. Texte brut renvoyé par Gemini :", cleanedText);
      return { error: "Notre expert a formulé une réponse illisible. Veuillez réessayer." };
    }

    // US-004 : on ne régénère les 4 cadences saisonnières que si la plante suit
    // les saisons. C'est aussi le chemin utilisé par reactivateSeasonality() pour
    // les plantes historiques figées (elle passe follows_seasons=true au préalable).
    const frequencyFields = plant.follows_seasons ? {
      watering_freq_spring: plantData.watering_freq_spring,
      watering_freq_summer: plantData.watering_freq_summer,
      watering_freq_autumn: plantData.watering_freq_autumn,
      watering_freq_winter: plantData.watering_freq_winter,
    } : {};

    const { error } = await supabase.from("plants").update({
      ...frequencyFields,
      origin: plantData.origin,
      robustness: plantData.robustness,
      robustness_score: plantData.robustness_score,
      max_size: plantData.max_size,
      max_size_short: plantData.max_size_short,
      ideal_substrate: plantData.ideal_substrate,
      ideal_exposure: plantData.ideal_exposure,
      light_care: plantData.light_care,
      watering_care: plantData.watering_care,
      substrate_care: plantData.substrate_care,
      seasonal_care: plantData.seasonal_care,
      room_advice: plantData.room_advice,
      light_advice: plantData.light_advice,
    }).eq("id", plantId);

    if (error) throw error;

    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("Update Advice Error:", error);
    return { error: "Erreur lors de la mise à jour des conseils." };
  }
}


// ── TYPE PARTAGÉ ────────────────────────────────────────────────────
export interface PlantDiagnostic {
  id: string;
  diagnosis: string;
  urgency: string;
  action: string;
  created_at: string;
}

// ── LIRE L'HISTORIQUE ───────────────────────────────────────────────
export async function getPlantDiagnostics(plantId: string): Promise<PlantDiagnostic[]> {
  const supabase = await createClient();
  const user = await getAuthenticatedUser();
  if (!user) return [];
  const { data } = await supabase
    .from("plant_diagnoses")
    .select("id, diagnosis, urgency, action, created_at")
    .eq("plant_id", plantId)
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

// ── SUPPRIMER UN DIAGNOSTIC ─────────────────────────────────────────
export async function deleteDiagnosis(diagnosticId: string, plantId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };
  const { error } = await supabase
    .from("plant_diagnoses")
    .delete()
    .eq("id", diagnosticId)
    .eq("user_id", user.id);
  if (error) return { error: "Impossible de supprimer ce diagnostic." };
  revalidatePath(`/dashboard/plant/${plantId}`);
  return { success: true };
}

// ── DOCTEUR PLANTE — DIAGNOSTIC UNIFIÉ ──────────────────────────────
// Remplace les anciennes diagnoseSickPlant (contextuelle, fiche plante) et
// quickDiagnosePlant (générique, dashboard) par un seul flux : la plante est
// optionnelle (sélectionnée dans la Jungle ou non), et des réponses rapides
// (état du terreau, évènement récent) viennent enrichir le contexte stocké.
export interface DiagnosisQuickAnswers {
  soilState?: string;   // "Sec" | "Normal" | "Détrempé" | ""
  events?: string[];    // ex: ["Rempotage récent", "Animal ou enfant"]
  otherDetails?: string;
}

export async function diagnosePlant(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    if (!file) return { error: "Aucune image fournie." };

    const plantId = (formData.get("plantId") as string) || null;
    const soilState = (formData.get("soilState") as string) || "";
    const otherDetails = (formData.get("otherDetails") as string) || "";
    let events: string[] = [];
    try { events = JSON.parse((formData.get("events") as string) || "[]"); } catch { events = []; }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type;

    // Contexte de la plante, uniquement si sélectionnée dans la Jungle
    let plant: any = null;
    let plantContextPrompt = "";
    if (plantId) {
      const { data } = await supabase.from("plants").select("*").eq("id", plantId).eq("user_id", user.id).single();
      plant = data;
      if (plant) {
        // US-003 : vraie saison astronomique — le Docteur Plante raisonne sur la
        // biologie réelle, indépendamment du consentement de l'utilisateur au
        // changement de cadence (qui ne concerne que ce qui est PROMIS, pas la
        // saison réelle).
        const currentSeason = SEASON_LABEL_FR[getAstronomicalSeason()];

        let daysSinceWatering = "inconnu";
        if (plant.last_watered_at) {
          const diff = Math.floor((Date.now() - new Date(plant.last_watered_at).getTime()) / 86400000);
          daysSinceWatering = `${diff} jour(s)`;
        }

        plantContextPrompt = `
          Cette plante fait partie de la Jungle de l'utilisateur : ${plant.name} (${plant.species || "espèce non précisée"}).

          DONNÉES D'ENTRETIEN DE CETTE PLANTE :
          - Fréquence d'arrosage recommandée : tous les ${plant.promised_watering_interval_days || "?"} jours.
          - Dernier arrosage : il y a ${daysSinceWatering} (date : ${plant.last_watered_at || "inconnue"}).
          - Exposition actuelle : "${plant.exposure || "inconnue"}" / Exposition idéale : "${plant.ideal_exposure || "inconnue"}".
          - Substrat idéal : ${plant.ideal_substrate || "non précisé"}.
          - Conseil arrosage : ${plant.watering_care?.detail ? plant.watering_care.detail.substring(0, 200) : "aucun"}.
          - Saison actuelle : ${currentSeason}.
          - Pièce : "${plant.room || "Inconnue"}".
        `;
      }
    }

    // Réponses aux questions rapides posées avant l'analyse
    let answersPrompt = "";
    if (soilState || events.length > 0 || otherDetails) {
      answersPrompt = `
        RÉPONSES DE L'UTILISATEUR AUX QUESTIONS RAPIDES (observations fraîches, à prioriser sur les données stockées) :
        ${soilState ? `- État actuel du terreau : ${soilState}.` : ""}
        ${events.length > 0 ? `- Évènement(s) récent(s) signalé(s) : ${events.join(", ")}.` : ""}
        ${otherDetails ? `- Détail complémentaire donné par l'utilisateur : "${otherDetails}".` : ""}
      `;
    }

    // 🟢 Super Contexte (maison, pièces)
    const contextPrompt = await getUserContextPrompt(user);

    // Prompt volontairement court — une version plus détaillée (méthode d'analyse pas
    // à pas, grille de calibration) a fait exploser le temps de réponse de gemini-2.5-flash
    // (son "thinking" interne s'emballe sur les consignes de raisonnement multi-étapes),
    // au point de dépasser le timeout même avec thinkingBudget désactivé. On revient à un
    // prompt proche de l'original, en gardant le contexte plante + les réponses aux
    // questions rapides qui sont le vrai apport de cette feature.
    const prompt = `
      Tu es un botaniste expert en maladies des plantes d'intérieur.
      ${plant
        ? `L'utilisateur consulte pour une plante de sa Jungle : ${plant.name} (${plant.species || "espèce non précisée"}).`
        : `L'utilisateur te montre la photo d'une plante malade, potentiellement hors de sa Jungle. Identifie-la si possible.`
      }

      ${plantContextPrompt}
      ${answersPrompt}
      ${contextPrompt}

      Prends en compte ces données pour affiner le diagnostic : un arrosage trop fréquent, une exposition inadaptée, un substrat inadéquat ou un évènement récent signalé par l'utilisateur peuvent directement causer les symptômes visibles. Analyse attentivement la photo.

      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
      {
        ${plant ? "" : `"name": "Nom de la plante (si identifiable, sinon 'Plante inconnue')",`}
        "diagnosis": "Un diagnostic précis mais formulé de manière simple et rassurante (2 phrases max).",
        "urgency": "Faible", // Choisir STRICTEMENT parmi: Faible, Moyenne, Haute
        "action": "Une instruction claire, étape par étape (avec des tirets -), de ce qu'il faut faire immédiatement pour la sauver."
      }
    `;

    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as any,
    });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);

    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    let diagnosisData;
    try {
      diagnosisData = JSON.parse(cleanedText);
    } catch {
      return { error: "Impossible d'analyser le diagnostic." };
    }

    // Persistance dans plant_diagnoses (plant_id null = diagnostic hors Jungle)
    await supabase.from("plant_diagnoses").insert({
      plant_id: plantId,
      user_id: user.id,
      plant_name: plant?.name ?? diagnosisData.name ?? "Plante inconnue",
      diagnosis: diagnosisData.diagnosis,
      urgency: diagnosisData.urgency,
      action: diagnosisData.action,
    });

    if (plantId) {
      // Cap à 10 diagnostics par plante — supprimer les plus anciens si dépassé
      const { data: allDiags } = await supabase
        .from("plant_diagnoses")
        .select("id")
        .eq("plant_id", plantId)
        .order("created_at", { ascending: true });
      if (allDiags && allDiags.length > 10) {
        const toDelete = allDiags.slice(0, allDiags.length - 10).map((d: { id: string }) => d.id);
        await supabase.from("plant_diagnoses").delete().in("id", toDelete);
      }
      revalidatePath(`/dashboard/plant/${plantId}`);
    }

    return { success: true, data: diagnosisData, plantId };

  } catch (error) {
    console.error("Diagnosis error:", error);
    return { error: "Impossible d'analyser l'image. Notre assistant a rencontré un problème." };
  }
}

// ANALYSE RAPIDE EN JARDINERIE (SCANNER)
export async function quickAnalyzePlant(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    if (!file) return { error: "Aucune image fournie." };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };
    
    // 🟢 Super Contexte
    const contextPrompt = await getUserContextPrompt(user);

    const prompt = `
      Tu es un expert en botanique aidant un client en pleine jardinerie. Le client vient de prendre en photo cette plante.
      Fais une identification rapide et donne-lui les informations clés pour qu'il décide de l'acheter ou non. Pas de blabla, sois direct et visuel.
      
      ${contextPrompt}

      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code) :
      {
        "name": "Nom commun",
        "species": "Nom scientifique",
        "robustness": 8, 
        "robustness_comment": "Explication très courte sur la note.",
        "light": "Exigence en lumière (court)",
        "water": "Exigence en eau (court)",
        "toxicity": "Toxique pour animaux ? (Oui / Non / Un peu)",
        "match_comment": "En une phrase, dis-lui si cette plante est faite pour lui. SI OUI, indique-lui textuellement dans laquelle de ses pièces configurées elle serait le mieux."
      }
      Si ce n'est pas une plante, retourne exactement : {"name": "Erreur", "species": "", "robustness": 0, "robustness_comment": "Ceci n'est pas une plante", "light": "", "water": "", "toxicity": "", "match_comment": ""}
    `;

    // thinkingBudget: 0 — même correctif que sur analyzePlantForForm/diagnosePlant :
    // évite les timeouts silencieux liés au mode "réflexion" de Gemini 2.5 Flash.
    const model = genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as any,
    });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);

    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch {
      return { error: "Analyse impossible. Veuillez réessayer." };
    }

    if (parsedData.name && parsedData.name !== "Erreur") {
      const { error: dbError } = await supabase.from("quick_scans").insert({
        user_id: user.id,
        name: parsedData.name,
        species: parsedData.species,
        robustness: parsedData.robustness,
        robustness_comment: parsedData.robustness_comment,
        light: parsedData.light,
        water: parsedData.water,
        toxicity: parsedData.toxicity,
        match_comment: parsedData.match_comment
      });
      if (dbError) console.error("Erreur sauvegarde historique:", dbError);
    }

    return { success: true, data: parsedData };
  } catch (error) {
    console.error("Scan error:", error);
    return { error: "Analyse impossible. Veuillez réessayer." };
  }
}

// RÉCUPÉRER L'HISTORIQUE DES SCANS RAPIDES
export async function getQuickScansHistory() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const { data, error } = await supabase
      .from("quick_scans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Fetch history error:", error);
    return { error: "Impossible de récupérer l'historique." };
  }
}

// ARROSER LA PLANTE
export async function waterPlant(plantId: string, currentHistory: string[] = []) {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const newHistory = [now, ...currentHistory].slice(0, 3);

    // US-002/US-003 : l'arrosage est l'un des 3 moments où l'intervalle promis se
    // fige — on capture la cadence de la saison EFFECTIVE du compte maintenant,
    // elle ne bougera plus tant que cette plante n'aura pas été arrosée à nouveau
    // (même si la saison change, même si l'IA régénère ses conseils entre-temps).
    // La saison effective (et non le mois calendaire brut) est ce qui fait tenir
    // un refus de changement de saison dans la durée — voir getEffectiveSeason().
    const { data: { user } } = await supabase.auth.getUser();
    const { data: plant } = await supabase
      .from("plants")
      .select(
        "watering_freq_spring, watering_freq_summer, watering_freq_autumn, watering_freq_winter, promised_watering_interval_days"
      )
      .eq("id", plantId)
      .single();
    const newPromisedInterval = plant ? getSeasonFrequency(plant, getEffectiveSeason(user)) : 7;

    const { error } = await supabase
      .from("plants")
      .update({
        last_watered_at: now,
        watering_history: newHistory,
        snooze_days: 0,
        promised_watering_interval_days: newPromisedInterval,
      })
      .eq("id", plantId);

    if (error) {
      console.error("Erreur d'arrosage:", error);
      return { error: "Impossible d'arroser la plante." };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return { error: "Impossible d'arroser la plante." };
  }
}

// ==========================================
// FERTILISER LA PLANTE
// ==========================================
export async function fertilizePlant(plantId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Non autorisé' };

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('plants')
      .update({ last_fertilized_at: now })
      .eq('id', plantId);

    if (error) {
      console.error('Erreur fertilisation:', error);
      return { error: "Impossible d'enregistrer la fertilisation." };
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return { error: "Impossible d'enregistrer la fertilisation." };
  }
}

// REPOUSSER L'ARROSAGE (SNOOZE)
export async function snoozeWatering(plantId: string, currentSnooze: number = 0) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("plants")
      .update({ snooze_days: currentSnooze + 3 }) 
      .eq("id", plantId);

    if (error) {
      console.error("Erreur de décalage:", error);
      return { error: "Impossible de repousser l'arrosage." };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return { error: "Impossible de repousser l'arrosage." };
  }
}

// ANNULER UN ARROSAGE OU UN REPORT (fenêtre d'annulation affichée dans le toast,
// côté client ; cette action se contente de restaurer l'état d'avant l'action)
export async function restoreWateringState(
  plantId: string,
  previous: {
    lastWateredAt: string | null;
    wateringHistory: string[];
    snoozeDays: number;
    // US-002 : sans ce champ, annuler un arrosage laisserait la plante avec le
    // NOUVEL intervalle promis tout en restaurant l'ANCIENNE date — un état
    // incohérent que personne ne verrait venir avant le prochain arrosage.
    promisedIntervalDays: number;
  }
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("plants")
      .update({
        last_watered_at: previous.lastWateredAt,
        watering_history: previous.wateringHistory,
        snooze_days: previous.snoozeDays,
        promised_watering_interval_days: previous.promisedIntervalDays,
      })
      .eq("id", plantId);

    if (error) {
      console.error("Erreur d'annulation:", error);
      return { error: "Impossible d'annuler." };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return { error: "Impossible d'annuler." };
  }
}

// SUPPRIMER LA PLANTE
export async function deletePlant(plantId: string, imageUrl: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Non autorisé" };

  try {
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop(); 
      if (fileName) {
        await supabase.storage.from("plant-images").remove([fileName]);
      }
    }

    const { error } = await supabase
      .from("plants")
      .delete()
      .eq("id", plantId)
      .eq("user_id", user.id);

    if (error) return { error: "Erreur lors de la suppression en base de données." };

  } catch (error) {
    console.error("Delete Error:", error);
    return { error: "Une erreur inattendue est survenue." };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// MARQUER UNE PLANTE COMME MORTE (Jardin des souvenirs)
export async function markPlantDeceased(plantId: string, reason: string | null) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();
    if (!user) return { error: "Non autorisé" };

    const { error } = await supabase
      .from("plants")
      .update({
        is_deceased: true,
        deceased_at: new Date().toISOString(),
        deceased_reason: reason,
      })
      .eq("id", plantId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/plants");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/memorial");
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("markPlantDeceased error:", error);
    return { error: "Impossible de marquer cette plante comme morte." };
  }
}

// RESTAURER UNE PLANTE (annuler le marquage "morte")
export async function restorePlant(plantId: string) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();
    if (!user) return { error: "Non autorisé" };

    const { error } = await supabase
      .from("plants")
      .update({
        is_deceased: false,
        deceased_at: null,
        deceased_reason: null,
      })
      .eq("id", plantId)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/plants");
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/memorial");
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("restorePlant error:", error);
    return { error: "Impossible de restaurer cette plante." };
  }
}

// JARDIN DES SOUVENIRS : liste des plantes décédées
export async function getDeceasedPlants() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("plants")
      .select("id, name, species, image_path, deceased_at, deceased_reason")
      .eq("user_id", user.id)
      .eq("is_deceased", true)
      .order("deceased_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("getDeceasedPlants error:", error);
    return [];
  }
}

// Compteur léger pour la page Profil (évite de charger toutes les lignes)
export async function getDeceasedPlantsCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from("plants")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_deceased", true);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("getDeceasedPlantsCount error:", error);
    return 0;
  }
}

// METTRE À JOUR L'ENVIRONNEMENT ET RÉGÉNÉRER L'AVIS
export async function updatePlantEnvironmentWithAI(plantId: string, room: string, light: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: "Non autorisé" };

    const { data: plant, error: fetchError } = await supabase
      .from("plants")
      .select("name, species")
      .eq("id", plantId)
      .single();

    if (fetchError || !plant) return { error: "Plante introuvable" };

    // 🟢 Super Contexte
    const contextPrompt = await getUserContextPrompt(user);

    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const prompt = `
      Tu es un expert en plantes d'intérieur.
      L'utilisateur possède la plante suivante : Nom commun "${plant.name}", Espèce "${plant.species}".
      Il vient de la déplacer dans un nouvel emplacement.
      Nouvelle pièce choisie : "${room}"
      Nouvelle luminosité locale : "${light}"

      ${contextPrompt}

      Vérifie si les caractéristiques de cette nouvelle pièce sont adaptées à la plante.
      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
      {
        "room_advice": "Ton avis d'expert court sur ce nouvel emplacement en fonction des caractéristiques de la pièce.",
        "light_advice": "Ton avis d'expert court sur la nouvelle luminosité. Est-ce suffisant ou trop fort pour cette espèce ?"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    let adviceData;
    try {
      adviceData = JSON.parse(cleanedText);
    } catch {
      return { error: "Erreur lors de l'analyse du nouvel emplacement." };
    }

    const { error: updateError } = await supabase
      .from("plants")
      .update({
        room: room,
        exposure: light,
        room_advice: adviceData.room_advice,
        light_advice: adviceData.light_advice
      })
      .eq("id", plantId);

    if (updateError) throw updateError;

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/plant/${plantId}`);
    
    return { success: true };

  } catch (error) {
    console.error("Update Env Error:", error);
    return { error: "Erreur lors de l'analyse du nouvel emplacement." };
  }
}

// DÉCONNEXION
export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}


// METTRE À JOUR LE CONTEXTE (METADATA)
// 🟢 (Mise à jour Faille 1)
export async function updateProfileContext(formData: FormData) {
  try {
    const supabase = await createClient();
    const city = formData.get("city");

    const { error } = await supabase.auth.updateUser({
      data: { city }
    });

    if (error) return { error: error.message };
    
    revalidatePath("/dashboard/my-home"); 
    return { success: true };
  } catch (error) {
    return { error: "Erreur inattendue." };
  }
}

// METTRE À JOUR LA SÉCURITÉ (EMAIL / MDP)
// 🟢 Le mot de passe actuel est revérifié avant toute modification : évite qu'une session
// déjà ouverte (appareil partagé, session volée) permette de changer les identifiants
// sans connaître le mot de passe actuel.
export async function updateSecurity(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return { error: "Session invalide." };

    const currentPassword = formData.get("currentPassword") as string;
    if (!currentPassword) {
      return { error: "Merci de renseigner votre mot de passe actuel." };
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      return { error: "Mot de passe actuel incorrect." };
    }

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const updates: any = {};
    if (email && email !== user.email) updates.email = email;
    if (password) updates.password = password;

    if (Object.keys(updates).length === 0) {
      return { error: "Aucune modification à enregistrer." };
    }

    const { error } = await supabase.auth.updateUser(updates);

    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    return { error: "Erreur inattendue." };
  }
}

// METTRE À JOUR LE MOT DE PASSE APRÈS UN LIEN DE RÉCUPÉRATION ("mot de passe oublié")
// La session active à ce stade est la session de récupération créée par /auth/callback
// à partir du lien reçu par email — pas besoin de redemander l'ancien mot de passe ici,
// l'utilisateur vient de prouver la possession de sa boîte mail.
export async function updatePasswordAfterRecovery(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Session expirée. Merci de redemander un lien." };

    const password = formData.get("password") as string;
    if (!password || password.length < 6) {
      return { error: "Le mot de passe doit contenir au moins 6 caractères." };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };

    return { success: true };
  } catch (error) {
    return { error: "Erreur inattendue." };
  }
}


// REFUS DÉFINITIF DU "SOFT ASK" DES RAPPELS (US-001)
// Mémorisé dans user_metadata (et non localStorage) pour suivre l'utilisateur d'un
// appareil à l'autre : on ne re-propose plus après un refus explicite. Une simple
// fermeture de l'écran (report) n'appelle pas cette action — elle est gérée côté
// client et la proposition pourra réapparaître.
export async function dismissPushSoftAsk() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const { error } = await supabase.auth.updateUser({
      data: { push_softask_declined_at: new Date().toISOString() },
    });
    if (error) return { error: error.message };

    return { success: true };
  } catch (error) {
    return { error: "Erreur inattendue." };
  }
}


// ================================================================
// CONSENTEMENT AU CHANGEMENT DE SAISON — US-003
// ================================================================

export interface SeasonConsentStatus {
  show: boolean;
  season: Season;
  seasonLabel: string;
  concernedCount: number;
  avgBefore: number;
  avgAfter: number;
}

const EMPTY_STATUS = (season: Season): SeasonConsentStatus => ({
  show: false,
  season,
  seasonLabel: SEASON_LABEL_FR[season],
  concernedCount: 0,
  avgBefore: 0,
  avgAfter: 0,
});

// Détermine si l'écran de proposition doit être affiché, avec les chiffres exacts
// qu'il doit annoncer (nombre de plantes concernées, cadence moyenne avant/après).
// Initialise silencieusement season_consent pour un compte qui n'en a encore
// aucun (créé après cette US) : rien à lui proposer, aucune ancienne règle dont
// le protéger — voir la note dans getEffectiveSeason().
export async function getSeasonConsentStatus(): Promise<SeasonConsentStatus | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const season = getAstronomicalSeason();
    const year = new Date().getUTCFullYear();
    const consent = user.user_metadata?.season_consent as
      | { effectiveSeason?: Season; effectiveYear?: number; lastAskedSeason?: Season; lastAskedYear?: number }
      | undefined;

    if (!consent) {
      await supabase.auth.updateUser({
        data: {
          season_consent: {
            effectiveSeason: season,
            effectiveYear: year,
            lastAskedSeason: season,
            lastAskedYear: year,
          },
        },
      });
      return EMPTY_STATUS(season);
    }

    // Déjà répondu pour CETTE saison précise (année comprise, pour ne pas
    // confondre l'automne 2026 et l'automne 2027) : on ne repose pas la question.
    if (consent.lastAskedSeason === season && consent.lastAskedYear === year) {
      return EMPTY_STATUS(season);
    }

    const { data: plants } = await supabase
      .from("plants")
      .select(
        "promised_watering_interval_days, watering_freq_spring, watering_freq_summer, watering_freq_autumn, watering_freq_winter"
      )
      .eq("user_id", user.id)
      .eq("follows_seasons", true)
      .eq("is_deceased", false);

    const concerned = (plants ?? [])
      .map((p) => ({ before: p.promised_watering_interval_days, after: getSeasonFrequency(p, season) }))
      .filter((p) => p.before !== p.after);

    if (concerned.length === 0) return EMPTY_STATUS(season);

    const avgBefore = Math.round(concerned.reduce((sum, p) => sum + p.before, 0) / concerned.length);
    const avgAfter = Math.round(concerned.reduce((sum, p) => sum + p.after, 0) / concerned.length);

    return {
      show: true,
      season,
      seasonLabel: SEASON_LABEL_FR[season],
      concernedCount: concerned.length,
      avgBefore,
      avgAfter,
    };
  } catch (error) {
    console.error("getSeasonConsentStatus error:", error);
    return null;
  }
}

// Accepter : rétroactivité CONSENTIE (et non subie, ce qu'US-002 interdit) —
// l'utilisateur vient de dire oui sur un écran qui lui en a annoncé l'effet
// chiffré. Recalcule immédiatement l'intervalle promis de toutes les plantes non
// figées manuellement. Sans ce recalcul, la fonctionnalité serait inopérante :
// chaque plante n'adopterait la nouvelle saison qu'à son prochain arrosage, soit
// après la fin de la saison qu'on cherche justement à corriger.
export async function applySeasonConsent() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const season = getAstronomicalSeason();
    const year = new Date().getUTCFullYear();

    const { data: plants } = await supabase
      .from("plants")
      .select(
        "id, watering_freq_spring, watering_freq_summer, watering_freq_autumn, watering_freq_winter, promised_watering_interval_days"
      )
      .eq("user_id", user.id)
      .eq("follows_seasons", true);

    await Promise.all(
      (plants ?? []).map((p) =>
        supabase
          .from("plants")
          .update({ promised_watering_interval_days: getSeasonFrequency(p, season) })
          .eq("id", p.id)
      )
    );

    const { error } = await supabase.auth.updateUser({
      data: {
        season_consent: {
          effectiveSeason: season,
          effectiveYear: year,
          lastAskedSeason: season,
          lastAskedYear: year,
        },
      },
    });
    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/plants");
    return { success: true };
  } catch (error) {
    console.error("applySeasonConsent error:", error);
    return { error: "Impossible d'appliquer le changement de saison." };
  }
}

// Refuser : n'écrit RIEN sur les plantes. La saison effective du compte ne
// bouge pas — seul le repère "déjà demandé" avance, pour ne pas reposer la
// question deux fois pour la même saison.
export async function declineSeasonConsent() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const season = getAstronomicalSeason();
    const year = new Date().getUTCFullYear();
    const existing = (user.user_metadata?.season_consent as Record<string, unknown>) ?? {};

    const { error } = await supabase.auth.updateUser({
      data: {
        season_consent: {
          ...existing,
          lastAskedSeason: season,
          lastAskedYear: year,
        },
      },
    });
    if (error) return { error: error.message };

    return { success: true };
  } catch (error) {
    console.error("declineSeasonConsent error:", error);
    return { error: "Impossible d'enregistrer votre choix." };
  }
}


// LIRE LES RECOMMANDATIONS SAUVEGARDÉES
export async function getEquipmentRecommendations() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("equipment_recommendations")
      .select("recommendations")
      .eq("user_id", user.id)
      .single();

    if (error || !data) return null;
    return data.recommendations;
  } catch (error) {
    return null;
  }
}

// GÉNÉRER ET SAUVEGARDER LA TROUSSE À OUTILS
export async function generateEquipmentRecommendations() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const { data: plants, error: plantsError } = await supabase
      .from("plants")
      .select("name, species, ideal_substrate")
      .eq("user_id", user.id);

    if (plantsError) throw plantsError;

    if (!plants || plants.length === 0) {
      return { error: "Vous n'avez pas encore de plantes dans votre jungle. Ajoutez-en pour obtenir des recommandations !" };
    }

    // 🟢 Super Contexte
    const environmentContext = await getUserContextPrompt(user);

    const plantsList = plants.map(p => `- ${p.name} (${p.species}) : substrat idéal -> ${p.ideal_substrate || 'inconnu'}`).join('\n');

    const prompt = `
      Tu es un expert botaniste. L'utilisateur veut savoir quels produits et matériels il doit absolument posséder pour s'occuper de sa "jungle" spécifique.

      ${environmentContext}

      Liste de ses plantes actuelles :
      ${plantsList}

      Déduis-en une "trousse à outils" (terreaux, engrais, accessoires, traitements préventifs) adaptée EXACTEMENT à ses plantes et aux différentes pièces de son environnement. Par exemple, s'il a des pièces sèches, recommande un brumisateur.

      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS markdown) :
      {
        "categories": [
          {
            "title": "Substrats & Terreaux",
            "icon": "layers",
            "items": [
              { "name": "Terreau pour plantes vertes", "reason": "Indispensable pour rempoter vos Monsteras." }
            ]
          }
        ],
        "expert_tip": "Un conseil global d'expert sur l'entretien ou le matériel."
      }
      Pour "icon", choisis uniquement parmi ces 3 mots en fonction du thème de la catégorie : "layers" (pour terreau/substrat), "droplet" (pour engrais/soins/eau), ou "wrench" (pour matériel/outils/pots).
      Crée au maximum 3 ou 4 catégories pertinentes.
    `;

    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent(prompt);
    
    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    let recommendations;
    try {
      recommendations = JSON.parse(cleanedText);
    } catch {
      return { error: "Impossible de générer les recommandations. Réessayez." };
    }

    const { error: dbError } = await supabase
      .from("equipment_recommendations")
      .upsert({
        user_id: user.id,
        recommendations: recommendations,
        updated_at: new Date().toISOString()
      });

    if (dbError) throw dbError;

    revalidatePath('/dashboard/my-home'); 
    return { success: true, data: recommendations };
  } catch (error) {
    console.error("Equipment Recs Error:", error);
    return { error: "Impossible de générer les recommandations. Réessayez." };
  }
}

// ==========================================
// GESTION DES PIÈCES (MICRO-CLIMATS)
// ==========================================

export async function getUserRooms() {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erreur getUserRooms:", error);
    return [];
  }
}

export async function getUrgentWateringCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();
    if (!user) return 0;

    // US-002 : compte directement `is_urgent` sur la vue plants_watering_status
    // (autorité unique de calcul de l'échéance) au lieu de recharger chaque plante
    // et de recalculer son statut ici.
    const { count, error } = await supabase
      .from("plants_watering_status")
      .select("id", { count: "exact", head: true })
      .eq("is_urgent", true);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Erreur getUrgentWateringCount:", error);
    return 0;
  }
}

export async function saveRoom(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const roomId = formData.get("id") as string;
    
    const roomData = {
      user_id: user.id,
      name: formData.get("name") as string,
      orientation: formData.get("orientation") as string,
      light_level: formData.get("light_level") as string,
      humidity: formData.get("humidity") as string,
      temp_summer: formData.get("temp_summer") ? parseInt(formData.get("temp_summer") as string) : null,
      temp_winter: formData.get("temp_winter") ? parseInt(formData.get("temp_winter") as string) : null,
    };

    if (roomId) {
      const { error } = await supabase.from("rooms").update(roomData).eq("id", roomId).eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("rooms").insert([roomData]);
      if (error) throw error;
    }

    revalidatePath("/dashboard/my-home");
    return { success: true };
  } catch (error) {
    console.error("Erreur saveRoom:", error);
    return { error: "Impossible de sauvegarder la pièce." };
  }
}

export async function deleteRoom(roomId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const { error } = await supabase.from("rooms").delete().eq("id", roomId).eq("user_id", user.id);
    if (error) throw error;

    revalidatePath("/dashboard/my-home");
    return { success: true };
  } catch (error) {
    return { error: "Impossible de supprimer la pièce." };
  }
}


// NOTE : l'ancien diagnostic générique (quickDiagnosePlant) a été fusionné
// dans diagnosePlant() ci-dessus — voir la section "DOCTEUR PLANTE — DIAGNOSTIC UNIFIÉ".


// SAUVEGARDER UN DIAGNOSTIC DANS LES NOTES D'ENTRETIEN
export async function appendDiagnosisToNotes(plantId: string, diagnosisText: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { data: plant } = await supabase
    .from("plants")
    .select("diagnosis_notes")
    .eq("id", plantId)
    .eq("user_id", user.id)
    .single();
  if (!plant) return { error: "Plante introuvable" };

  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const note = `\n\n📋 Diagnostic du ${date} :\n${diagnosisText}`;
  const updatedNotes = (plant.diagnosis_notes || "") + note;

  const { error } = await supabase
    .from("plants")
    .update({ diagnosis_notes: updatedNotes })
    .eq("id", plantId);
  if (error) return { error: "Impossible de sauvegarder." };

  revalidatePath(`/dashboard/plant/${plantId}`);
  return { success: true };
}


// ================================================================
// JOURNAL DE CROISSANCE — Sprint 1
// ================================================================

export async function addGrowthPhoto(plantId: string, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Non autorisé' };

    const { count } = await supabase
      .from('plant_growth_photos')
      .select('*', { count: 'exact', head: true })
      .eq('plant_id', plantId);
    if ((count ?? 0) >= 30)
      return { error: 'Limite de 30 photos atteinte pour cette plante.' };

    const file = formData.get('image') as File;
    const note = formData.get('note') as string | null;
    const takenAt = formData.get('taken_at') as string;
    if (!file || file.size === 0) return { error: 'Aucune image fournie.' };

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `growth-${user.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(fileName, file);
    if (uploadError) return { error: 'Erreur lors de la sauvegarde de la photo.' };

    const { data: { publicUrl } } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('plant_growth_photos')
      .insert({
        plant_id: plantId,
        user_id: user.id,
        image_path: publicUrl,
        note: note || null,
        taken_at: takenAt ? new Date(takenAt).toISOString() : new Date().toISOString(),
      });
    if (dbError) {
      await supabase.storage.from('plant-images').remove([fileName]);
      return { error: 'Erreur lors de la sauvegarde en base.' };
    }

    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error('addGrowthPhoto error:', error);
    return { error: 'Une erreur inattendue est survenue.' };
  }
}

export async function getGrowthPhotos(plantId: string) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedUser();
    if (!user) return { error: 'Non autorisé' };

    const { data, error } = await supabase
      .from('plant_growth_photos')
      .select('*')
      .eq('plant_id', plantId)
      .eq('user_id', user.id)
      .order('taken_at', { ascending: true });

    if (error) throw error;
    return { success: true, data: data as GrowthPhoto[] };
  } catch (error) {
    console.error('getGrowthPhotos error:', error);
    return { error: 'Impossible de charger le journal.' };
  }
}

export async function deleteGrowthPhoto(
  photoId: string,
  plantId: string,
  imageUrl: string,
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Non autorisé' };

    const fileName = imageUrl.split('/').pop();
    if (fileName) {
      await supabase.storage.from('plant-images').remove([fileName]);
    }

    const { error } = await supabase
      .from('plant_growth_photos')
      .delete()
      .eq('id', photoId)
      .eq('user_id', user.id);

    if (error) return { error: 'Erreur lors de la suppression.' };

    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error('deleteGrowthPhoto error:', error);
    return { error: 'Une erreur inattendue est survenue.' };
  }
}

// METTRE À JOUR LA PHOTO PRINCIPALE D'UNE PLANTE
export async function updatePlantImage(
  plantId: string,
  formData: FormData
): Promise<{ success?: true; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Non autorisé' };

    const imageFile = formData.get('image') as File;
    if (!imageFile || imageFile.size === 0) return { error: 'Aucune image fournie.' };

    // Récupérer l'image_path actuelle pour suppression ultérieure
    const { data: plant } = await supabase
      .from('plants')
      .select('image_path')
      .eq('id', plantId)
      .eq('user_id', user.id)
      .single();

    const ext = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('plant-images')
      .upload(fileName, imageFile);
    if (uploadError) return { error: 'Erreur lors de la sauvegarde de l\'image.' };

    const { data: { publicUrl } } = supabase.storage
      .from('plant-images')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('plants')
      .update({ image_path: publicUrl })
      .eq('id', plantId)
      .eq('user_id', user.id);

    if (dbError) {
      await supabase.storage.from('plant-images').remove([fileName]);
      return { error: 'Erreur lors de la mise à jour en base de données.' };
    }

    // Supprimer l'ancienne image si elle existait
    if (plant?.image_path) {
      const oldFileName = plant.image_path.split('/').pop();
      if (oldFileName) {
        await supabase.storage.from('plant-images').remove([oldFileName]);
      }
    }

    revalidatePath(`/dashboard/plant/${plantId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('updatePlantImage error:', error);
    return { error: 'Une erreur inattendue est survenue.' };
  }
}
