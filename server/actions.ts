"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// 🟢 VARIABLE CENTRALISÉE POUR LE MODÈLE IA
// Pour passer à la version gratuite sans limite journalière, changez par : "gemini-2.5-flash-lite"
const AI_MODEL = "gemini-2.5-flash";


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
    
    // Utilisation de la variable centralisée
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

    const meta = user.user_metadata || {};
    const contextPrompt = meta.home_type ? `
      CONTEXTE GLOBAL DU DOMICILE :
      - Type : ${meta.home_type}
      - Ville/Climat : ${meta.city || 'Non précisé'}
      - Orientation : ${meta.orientation}
      - Luminosité moyenne : ${meta.light_level}
      -> Prends IMPÉRATIVEMENT ce contexte global en compte.
    ` : "";

    const prompt = `
      Analyse cette photo de plante d'intérieur. 
      L'utilisateur indique qu'elle est située ici : "${room || "Non précisé"}".
      La luminosité actuelle de la pièce est : "${light || "Non précisée"}".

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
        "room_advice": "Ton avis d'expert court sur le choix de la pièce en fonction du contexte global du domicile.",
        "light_advice": "Ton avis d'expert court sur la luminosité actuelle.",
        "care_notes": "Un guide d'entretien TRÈS détaillé et structuré. Utilise obligatoirement des doubles sauts de ligne (\\n\\n) pour séparer tes sections. Utilise des listes à puces (-) et des emojis pour aérer visuellement le texte."
      }
      Si ce n'est pas une plante, retourne exactement : {"name": "Erreur", "species": "Non reconnu", "watering_frequency": 0, "origin": "", "robustness": "", "max_size": "", "ideal_substrate": "", "ideal_exposure": "", "room_advice": "", "light_advice": "", "care_notes": "Ceci ne semble pas être une plante."}
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    const plantData = JSON.parse(cleanedText);

    if (plantData.name === "Erreur") return { error: "L'IA n'a pas reconnu de plante sur cette photo." };

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

  } catch (error) {
    console.error("Unexpected Error:", error);
    return { error: "Une erreur inattendue est survenue." };
  }

  revalidatePath("/dashboard");
  if (newPlantId) redirect(`/dashboard/plant/${newPlantId}`);
  else redirect("/dashboard");
}


export async function updatePlantAdvice(plantId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non autorisé" };

    const { data: plant } = await supabase.from("plants").select("*").eq("id", plantId).single();
    if (!plant) return { error: "Plante introuvable" };

    const meta = user.user_metadata || {};
    const contextPrompt = meta.home_type ? `
      CONTEXTE GLOBAL DU DOMICILE DE L'UTILISATEUR :
      - Type : ${meta.home_type}
      - Ville/Climat : ${meta.city || 'Non précisé'}
      - Orientation : ${meta.orientation}
      - Luminosité moyenne : ${meta.light_level}
      -> Prends IMPÉRATIVEMENT ce contexte global en compte pour tes conseils.
    ` : "";

    const prompt = `
      Tu es un expert en botanique. L'utilisateur souhaite mettre à jour les conseils d'entretien pour sa plante avec les données suivantes :
      - Nom commun : ${plant.name}
      - Espèce : ${plant.species}
      - Pièce actuelle : ${plant.room || "Non précisé"}
      - Exposition actuelle : ${plant.exposure || "Non précisée"}

      ${contextPrompt}

      Génère de nouveaux conseils adaptés. Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
      {
        "watering_frequency": 7,
        "origin": "Origine géographique (ex: Forêts tropicales d'Am. du Sud)",
        "robustness": "Note et petit comm. (ex: 8/10 - Pardonne les oublis)",
        "max_size": "Taille maximale en intérieur (ex: Jusqu'à 3m)",
        "ideal_substrate": "Substrat idéal (ex: Terreau léger et drainant)",
        "ideal_exposure": "Exposition idéale (ex: Lumière vive sans soleil direct)",
        "room_advice": "Avis expert court sur la pièce...",
        "light_advice": "Avis expert court sur la lumière...",
        "care_notes": "Un guide d'entretien TRÈS détaillé et structuré. Utilise obligatoirement des doubles sauts de ligne (\\n\\n) pour séparer tes sections. Utilise des listes à puces (-) et des emojis pour aérer visuellement le texte."
      }
    `;

    // Utilisation de la variable centralisée
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

    // 1. Récupération des infos de la plante
    const { data: plant } = await supabase.from("plants").select("*").eq("id", plantId).single();
    if (!plant) return { error: "Plante introuvable" };

    // 2. Conversion de l'image pour Gemini
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = file.type;

    // 3. Récupération du contexte utilisateur
    const meta = user.user_metadata || {};
    const contextPrompt = meta.home_type ? `
      CONTEXTE GLOBAL DE L'UTILISATEUR :
      - Type d'habitation : ${meta.home_type}
      - Luminosité moyenne : ${meta.light_level}
      - Orientation : ${meta.orientation}
      - Ville/Climat : ${meta.city || 'Non précisé'}
    ` : "";

    // 4. Prompt pour le rôle de Docteur des plantes
    const prompt = `
      Tu es un botaniste expert en maladies des plantes d'intérieur.
      L'utilisateur a utilisé un bouton "SOS" pour cette plante : ${plant.name} (${plant.species}).
      Son dernier arrosage date du : ${plant.last_watered_at}.
      
      ${contextPrompt}

      Analyse attentivement cette photo de la plante malade.
      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
      {
        "diagnosis": "Un diagnostic précis mais formulé de manière simple et rassurante (2 phrases max).",
        "urgency": "Faible", // Choisir STRICTEMENT parmi: Faible, Moyenne, Haute
        "action": "Une instruction claire, étape par étape (avec des tirets -), de ce qu'il faut faire immédiatement pour la sauver."
      }
    `;

    // 5. Appel à Gemini (Utilisation de la variable centralisée)
    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);

    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    return { success: true, data: JSON.parse(cleanedText) };

  } catch (error) {
    console.error("Diagnosis error:", error);
    return { error: "Impossible d'analyser l'image. L'IA a rencontré un problème." };
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
    
    const meta = user?.user_metadata || {};
    
    const contextPrompt = meta.home_type ? `
      CONTEXTE DE LA MAISON DU CLIENT :
      Habitation : ${meta.home_type}
      Luminosité : ${meta.light_level}
      Orientation : ${meta.orientation}
    ` : "Le client n'a pas renseigné son environnement.";

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
        "match_comment": "En une phrase, est-ce que cette plante est adaptée au 'CONTEXTE DE LA MAISON DU CLIENT' ?"
      }
      Si ce n'est pas une plante, retourne exactement : {"name": "Erreur", "species": "", "robustness": 0, "robustness_comment": "Ceci n'est pas une plante", "light": "", "water": "", "toxicity": "", "match_comment": ""}
    `;

    // Utilisation de la variable centralisée
    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);

    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    // Sauvegarde silencieuse dans la table quick_scans si ce n'est pas une erreur
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


// ARROSER LA PLANTE (Sans retour pour TS)
export async function waterPlant(plantId: string, currentHistory: string[] = []) {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    
    // On garde uniquement les 3 dernières dates
    const newHistory = [now, ...currentHistory].slice(0, 3);

    const { error } = await supabase
      .from("plants")
      .update({ 
        last_watered_at: now,
        watering_history: newHistory,
        snooze_days: 0 // On remet le décalage à zéro !
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

// REPOUSSER L'ARROSAGE (SNOOZE) (Sans retour pour TS)
export async function snoozeWatering(plantId: string, currentSnooze: number = 0) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("plants")
      .update({ snooze_days: currentSnooze + 3 }) // On ajoute 3 jours
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
    // 1. Supprimer l'image du bucket Storage
    if (imageUrl) {
      const fileName = imageUrl.split('/').pop(); 
      if (fileName) {
        await supabase.storage.from("plant-images").remove([fileName]);
      }
    }

    // 2. Supprimer la plante de la base de données
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

  // 3. Rafraîchir le cache et rediriger vers l'accueil
  revalidatePath("/dashboard");
  redirect("/dashboard");
}


// METTRE À JOUR L'ENVIRONNEMENT ET RÉGÉNÉRER L'AVIS IA
export async function updatePlantEnvironmentWithAI(plantId: string, room: string, light: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: "Non autorisé" };

    // 1. On récupère le nom et l'espèce de la plante pour donner du contexte à l'IA
    const { data: plant, error: fetchError } = await supabase
      .from("plants")
      .select("name, species")
      .eq("id", plantId)
      .single();

    if (fetchError || !plant) return { error: "Plante introuvable" };

    // 2. On interroge Gemini uniquement avec du texte (Utilisation de la variable centralisée)
    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const prompt = `
      Tu es un expert en plantes d'intérieur.
      L'utilisateur possède la plante suivante : Nom commun "${plant.name}", Espèce "${plant.species}".
      Il vient de la déplacer dans un nouvel environnement.
      Nouvelle pièce : "${room}"
      Nouvelle luminosité : "${light}"

      Retourne UNIQUEMENT un objet JSON valide avec la structure exacte suivante (SANS balises markdown ni code autour) :
      {
        "room_advice": "Ton avis d'expert court sur ce nouvel emplacement. Est-ce adapté à cette plante ?",
        "light_advice": "Ton avis d'expert court sur la nouvelle luminosité. Est-ce suffisant ou trop fort pour cette espèce ?"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const adviceData = JSON.parse(cleanedText);

    // 3. On met à jour la base de données
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

    // 4. On rafraîchit la page pour afficher les nouvelles données
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/plant/${plantId}`);
    
    return { success: true };

  } catch (error) {
    console.error("Update Env Error:", error);
    return { error: "Erreur lors de l'analyse IA du nouvel emplacement." };
  }
}


// DÉCONNEXION
export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}


// METTRE À JOUR LE CONTEXTE (METADATA)
export async function updateProfileContext(formData: FormData) {
  try {
    const supabase = await createClient();
    const home_type = formData.get("home_type");
    const orientation = formData.get("orientation");
    const light_level = formData.get("light_level");
    const city = formData.get("city");

    const { error } = await supabase.auth.updateUser({
      data: { home_type, orientation, light_level, city }
    });

    if (error) return { error: error.message };
    
    revalidatePath("/dashboard/profile");
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


// 1. LIRE LES RECOMMANDATIONS SAUVEGARDÉES
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

// 2. GÉNÉRER ET SAUVEGARDER LA TROUSSE À OUTILS
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

    const meta = user.user_metadata || {};
    const environmentContext = `
      Type d'habitation : ${meta.home_type || 'Non précisé'}
      Luminosité globale : ${meta.light_level || 'Non précisée'}
      Orientation : ${meta.orientation || 'Non précisée'}
    `;

    const plantsList = plants.map(p => `- ${p.name} (${p.species}) : substrat idéal -> ${p.ideal_substrate || 'inconnu'}`).join('\n');

    const prompt = `
      Tu es un expert botaniste. L'utilisateur veut savoir quels produits et matériels il doit absolument posséder pour s'occuper de sa "jungle" spécifique.

      Contexte de son domicile :
      ${environmentContext}

      Liste de ses plantes actuelles :
      ${plantsList}

      Déduis-en une "trousse à outils" (terreaux, engrais, accessoires, traitements préventifs) adaptée EXACTEMENT à ses plantes et son environnement.

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

    // Utilisation de la variable centralisée
    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent(prompt);
    
    const cleanedText = result.response.text().replace(/```json/gi, "").replace(/```/g, "").trim();
    const recommendations = JSON.parse(cleanedText);

    // SAUVEGARDE EN BASE DE DONNÉES
    const { error: dbError } = await supabase
      .from("equipment_recommendations")
      .upsert({
        user_id: user.id,
        recommendations: recommendations,
        updated_at: new Date().toISOString()
      });

    if (dbError) throw dbError;

    revalidatePath('/dashboard/profile'); 
    return { success: true, data: recommendations };
  } catch (error) {
    console.error("Equipment Recs Error:", error);
    return { error: "Impossible de générer les recommandations. Réessayez." };
  }
}
