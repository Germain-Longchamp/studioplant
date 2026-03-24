"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

    const model = genAI.getGenerativeModel({ model: AI_MODEL });

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

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const contextPrompt = await getUserContextPrompt(user);
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

    // 🚀 OPTIMISATION 1 : On prépare l'upload de l'image (Tâche A)
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
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

        Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
        {
          "name": "${prefilledName}",
          "species": "${prefilledSpecies}",
          "watering_frequency": 7,
          "origin": "Origine géographique (ex: Forêts tropicales d'Am. du Sud)",
          "robustness": "Note et petit comm. (ex: 8/10 - Pardonne les oublis)",
          "max_size": "Taille maximale en intérieur (ex: Jusqu'à 3m)",
          "ideal_substrate": "Substrat idéal (ex: Terreau léger et drainant)",
          "ideal_exposure": "Exposition idéale (ex: Lumière vive sans soleil direct)",
          "room_advice": "Ton avis d'expert court sur le choix de cette pièce en tenant compte de ses températures, son orientation et son humidité.",
          "light_advice": "Ton avis d'expert court sur la luminosité locale choisie.",
          "care_notes": "Un guide d'entretien TRÈS détaillé et structuré. Utilise obligatoirement des doubles sauts de ligne (\\n\\n) pour séparer tes sections. Utilise des listes à puces (-) et des emojis pour aérer visuellement le texte."
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

        Retourne UNIQUEMENT un JSON avec la structure : {"name": "...", "species": "...", "watering_frequency": 7, "origin": "...", "robustness": "...", "max_size": "...", "ideal_substrate": "...", "ideal_exposure": "...", "room_advice": "...", "light_advice": "...", "care_notes": "..."}
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

    if (plantData.name === "Erreur") return { error: "Nous n'avons pas réussi à identifier de plante sur cette photo." };

    // Récupération de l'URL de l'image fraîchement uploadée
    const { data: publicUrlData } = supabase.storage.from("plant-images").getPublicUrl(fileName);

    // Sauvegarde en base de données
    const { data: newPlant, error: dbError } = await supabase.from("plants").insert({
      user_id: user.id,
      name: plantData.name,
      species: plantData.species,
      watering_frequency: plantData.watering_frequency,
      exposure: light,
      room: room,
      description: "", 
      origin: plantData.origin,
      robustness: plantData.robustness,
      max_size: plantData.max_size,
      ideal_substrate: plantData.ideal_substrate,
      ideal_exposure: plantData.ideal_exposure,
      care_notes: plantData.care_notes,
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
      watering_frequency: 7, // Valeur par défaut temporaire
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
      max_size: "",
      ideal_substrate: "",
      ideal_exposure: "",
      care_notes: "",
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
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

    // On demande à Gemini TOUT le reste, basé sur la pièce et l'espèce
    const prompt = `
      Tu es un expert en botanique. L'utilisateur vient d'ajouter cette plante à sa collection :
      Nom : "${plant.name}"
      Espèce : "${plant.species}"

      Il l'a placée dans cette pièce : "${plant.room || "Non précisé"}".
      La luminosité locale de cet emplacement est : "${plant.exposure || "Non précisée"}".

      ${contextPrompt}

      Génère son carnet de santé complet.
      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
      {
        "watering_frequency": 7,
        "origin": "Origine géographique (ex: Forêts tropicales d'Am. du Sud)",
        "robustness": "Note et petit comm. (ex: 8/10 - Pardonne les oublis)",
        "max_size": "Taille maximale en intérieur (ex: Jusqu'à 3m)",
        "ideal_substrate": "Substrat idéal (ex: Terreau léger et drainant)",
        "ideal_exposure": "Exposition idéale (ex: Lumière vive sans soleil direct)",
        "room_advice": "Ton avis d'expert court sur le choix de cette pièce en tenant compte de ses températures, son orientation et son humidité.",
        "light_advice": "Ton avis d'expert court sur la luminosité locale choisie.",
        "care_notes": "Un guide d'entretien TRÈS détaillé et structuré. Utilise obligatoirement des doubles sauts de ligne (\\n\\n) pour séparer tes sections. Utilise des listes à puces (-) et des emojis."
      }
    `;

    const result = await model.generateContent(prompt);
    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    const plantData = JSON.parse(cleanedText);

    // On met à jour la base de données avec les nouvelles infos
    const { error: updateError } = await supabase.from("plants").update({
      watering_frequency: plantData.watering_frequency,
      origin: plantData.origin,
      robustness: plantData.robustness,
      max_size: plantData.max_size,
      ideal_substrate: plantData.ideal_substrate,
      ideal_exposure: plantData.ideal_exposure,
      room_advice: plantData.room_advice,
      light_advice: plantData.light_advice,
      care_notes: plantData.care_notes,
    }).eq("id", plantId);

    if (updateError) throw updateError;

    // 🟢 La magie de Next.js : On dit à la page de se rafraîchir en direct !
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("Deferred Generation Error:", error);
    return { error: "Erreur lors de la génération du carnet." };
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

      Structure exacte attendue :
      {
        "watering_frequency": 7,
        "origin": "Origine géographique (ex: Forêts tropicales d'Am. du Sud)",
        "robustness": "Note et petit comm. (ex: 8/10 - Pardonne les oublis)",
        "max_size": "Taille maximale en intérieur (ex: Jusqu'à 3m)",
        "ideal_substrate": "Substrat idéal (ex: Terreau léger et drainant)",
        "ideal_exposure": "Exposition idéale (ex: Lumière vive sans soleil direct)",
        "room_advice": "Avis expert court sur la pièce choisie (température, humidité...)",
        "light_advice": "Avis expert court sur la lumière...",
        "care_notes": "Un guide d'entretien TRÈS détaillé et structuré. Utilise obligatoirement des doubles sauts de ligne (\\n\\n) pour séparer tes sections. Utilise des listes à puces (-) et des emojis pour aérer visuellement le texte."
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

    const { error } = await supabase.from("plants").update({
      watering_frequency: plantData.watering_frequency,
      origin: plantData.origin,
      robustness: plantData.robustness,
      max_size: plantData.max_size,
      ideal_substrate: plantData.ideal_substrate,
      ideal_exposure: plantData.ideal_exposure,
      room_advice: plantData.room_advice,
      light_advice: plantData.light_advice,
      care_notes: plantData.care_notes,
    }).eq("id", plantId);

    if (error) throw error;
    
    revalidatePath(`/dashboard/plant/${plantId}`);
    return { success: true };
  } catch (error) {
    console.error("Update Advice Error:", error);
    return { error: "Erreur lors de la mise à jour des conseils." };
  }
}


// DIAGNOSTIC D'UNE PLANTE MALADE (SOS)
export async function diagnoseSickPlant(plantId: string, formData: FormData) {
  try {
    const file = formData.get("image") as File;
    if (!file) return { error: "Aucune image fournie." };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const { data: plant } = await supabase.from("plants").select("*").eq("id", plantId).single();
    if (!plant) return { error: "Plante introuvable" };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type;

    // 🟢 Super Contexte
    const contextPrompt = await getUserContextPrompt(user);

    const prompt = `
      Tu es un botaniste expert en maladies des plantes d'intérieur.
      L'utilisateur a utilisé un bouton "SOS" pour cette plante : ${plant.name} (${plant.species}).
      Son dernier arrosage date du : ${plant.last_watered_at}.
      La plante est placée dans la pièce suivante : "${plant.room || "Inconnue"}".
      
      ${contextPrompt}

      Vérifie si les caractéristiques de sa pièce (température, humidité) pourraient être la cause de sa maladie (ex: air trop sec, coup de froid).
      Analyse attentivement cette photo de la plante malade.
      
      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
      {
        "diagnosis": "Un diagnostic précis mais formulé de manière simple et rassurante (2 phrases max).",
        "urgency": "Faible", // Choisir STRICTEMENT parmi: Faible, Moyenne, Haute
        "action": "Une instruction claire, étape par étape (avec des tirets -), de ce qu'il faut faire immédiatement pour la sauver."
      }
    `;

    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);

    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    return { success: true, data: JSON.parse(cleanedText) };

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

    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);

    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

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

    const { error } = await supabase
      .from("plants")
      .update({ 
        last_watered_at: now,
        watering_history: newHistory,
        snooze_days: 0 
      })
      .eq("id", plantId);

    if (error) {
      console.error("Erreur d'arrosage:", error);
      return; 
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/plant/${plantId}`);
  } catch (error) {
    console.error("Erreur inattendue:", error);
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
      return; 
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/plant/${plantId}`);
  } catch (error) {
    console.error("Erreur inattendue:", error);
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
    const adviceData = JSON.parse(cleanedText);

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
export async function updateSecurity(formData: FormData) {
  try {
    const supabase = await createClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const updates: any = {};
    if (email) updates.email = email;
    if (password) updates.password = password;

    const { error } = await supabase.auth.updateUser(updates);
    
    if (error) return { error: error.message };
    return { success: true };
  } catch (error) {
    return { error: "Erreur inattendue." };
  }
}


// LIRE LES RECOMMANDATIONS SAUVEGARDÉES
export async function getEquipmentRecommendations() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
    const recommendations = JSON.parse(cleanedText);

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
    const { data: { user } } = await supabase.auth.getUser();
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


// DIAGNOSTIC GÉNÉRIQUE (DOCTEUR PLANTE)
export async function quickDiagnosePlant(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    if (!file) return { error: "Aucune image fournie." };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type;

    const prompt = `
      Tu es le "Docteur Plante", un botaniste expert en maladies des végétaux.
      L'utilisateur te montre la photo d'une plante malade qu'il a trouvée, sans contexte particulier.
      Analyse attentivement cette photo pour identifier la plante (si possible) et surtout son problème (maladie, parasites, carence, excès d'eau...).
      
      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
      {
        "name": "Nom de la plante (si identifiable, sinon 'Plante inconnue')",
        "diagnosis": "Un diagnostic clinique précis formulé de manière claire et rassurante (2 phrases max).",
        "urgency": "Faible", // Choisir STRICTEMENT parmi: Faible, Moyenne, Haute
        "action": "Une instruction médicale claire, étape par étape (avec des tirets -), de ce qu'il faut faire pour la sauver."
      }
    `;

    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);

    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    
    let diagnosisData;
    try {
      diagnosisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Erreur de format du diagnostic:", cleanedText);
      return { error: "Le docteur n'a pas pu rédiger l'ordonnance. Réessayez." };
    }

    return { success: true, data: diagnosisData };

  } catch (error) {
    console.error("Quick Diagnosis error:", error);
    return { error: "Impossible de consulter le docteur. Veuillez réessayer." };
  }
}
