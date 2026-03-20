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


export async function addPlantWithAI(formData: FormData) {
  const imageFile = formData.get("image") as File;
  const room = formData.get("room") as string;
  const light = formData.get("light") as string;
  
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

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const imagePart = { inlineData: { data: base64Data, mimeType: imageFile.type } };
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

    // 🟢 Utilisation du Super Contexte
    const contextPrompt = await getUserContextPrompt(user);

    const prompt = `
      Analyse cette photo de plante d'intérieur. 
      L'utilisateur a décidé de la placer dans cette pièce précise (qui fait partie de sa maison) : "${room || "Non précisé"}".
      La luminosité locale de cet emplacement précis est : "${light || "Non précisée"}".

      ${contextPrompt}

      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
      {
        "name": "Nom commun (ex: Monstera Deliciosa)",
        "species": "Nom scientifique",
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
      Si ce n'est pas une plante, retourne exactement : {"name": "Erreur", "species": "Non reconnu", "watering_frequency": 0, "origin": "", "robustness": "", "max_size": "", "ideal_substrate": "", "ideal_exposure": "", "room_advice": "", "light_advice": "", "care_notes": "Ceci ne semble pas être une plante."}
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    const plantData = JSON.parse(cleanedText);

    if (plantData.name === "Erreur") return { error: "Nous n'avons pas réussi à identifier de plante sur cette photo." };

    const fileExtension = imageFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    
    const { error: storageError } = await supabase.storage.from("plant-images").upload(fileName, imageFile);
    if (storageError) return { error: "Erreur lors de la sauvegarde de l'image." };

    const { data: publicUrlData } = supabase.storage.from("plant-images").getPublicUrl(fileName);

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
      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
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
    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    const plantData = JSON.parse(cleanedText);

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
