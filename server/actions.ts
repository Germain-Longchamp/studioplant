"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function addPlantWithAI(formData: FormData) {
  const imageFile = formData.get("image") as File;
  const room = formData.get("room") as string;
  const light = formData.get("light") as string;
  
  // Récupération de la date d'arrosage fournie par l'utilisateur
  const lastWateredInput = formData.get("lastWateredAt") as string;
  // Si l'utilisateur n'a rien mis, on prend la date d'aujourd'hui par défaut
  const lastWateredDate = lastWateredInput 
    ? new Date(lastWateredInput).toISOString() 
    : new Date().toISOString();

  if (!imageFile || imageFile.size === 0) {
    return { error: "Aucune image fournie." };
  }

  // Variable pour stocker l'ID de la nouvelle plante
  let newPlantId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { error: "Non autorisé" };

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: imageFile.type,
      },
    };

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
    });

    // --- INJECTION DU CONTEXTE UTILISATEUR ---
    const meta = user.user_metadata || {};
    const contextPrompt = meta.home_type ? `
      CONTEXTE GLOBAL DU DOMICILE :
      - Type : ${meta.home_type}
      - Ville/Climat : ${meta.city || 'Non précisé'}
      - Orientation : ${meta.orientation}
      - Luminosité moyenne : ${meta.light_level}
      -> Prends IMPÉRATIVEMENT ce contexte global en compte pour rédiger tes 'room_advice', 'light_advice' et 'care_notes'.
    ` : "";

    // PROMPT MIS À JOUR (Correction du formatage du guide d'entretien)
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
        "room_advice": "Ton avis d'expert court sur le choix de la pièce en fonction du contexte global du domicile.",
        "light_advice": "Ton avis d'expert court sur la luminosité actuelle.",
        "care_notes": "Un guide d'entretien TRÈS détaillé et structuré. Utilise obligatoirement des doubles sauts de ligne (\\n\\n) pour séparer tes sections. Utilise des listes à puces (-) et des emojis pour aérer visuellement le texte. Détaille le type de terreau idéal, l'humidité requise, le besoin en engrais et le nettoyage des feuilles."
      }
      Si ce n'est pas une plante, retourne exactement : {"name": "Erreur", "species": "Non reconnu", "watering_frequency": 0, "room_advice": "", "light_advice": "", "care_notes": "Ceci ne semble pas être une plante."}
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const plantData = JSON.parse(cleanedText);

    if (plantData.name === "Erreur") {
      return { error: "L'IA n'a pas reconnu de plante sur cette photo." };
    }

    const fileExtension = imageFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    
    const { error: storageError } = await supabase.storage
      .from("plant-images")
      .upload(fileName, imageFile);

    if (storageError) return { error: "Erreur lors de la sauvegarde de l'image." };

    const { data: publicUrlData } = supabase.storage.from("plant-images").getPublicUrl(fileName);

    // INSERTION MISE À JOUR EN BASE DE DONNÉES
    const { data: newPlant, error: dbError } = await supabase.from("plants").insert({
      user_id: user.id,
      name: plantData.name,
      species: plantData.species,
      watering_frequency: plantData.watering_frequency,
      exposure: light,
      room: room,
      description: "", // Laissé vide pour ne pas casser la structure si la colonne n'est pas "nullable"
      care_notes: plantData.care_notes,
      room_advice: plantData.room_advice,
      light_advice: plantData.light_advice,
      image_path: publicUrlData.publicUrl,
      last_watered_at: lastWateredDate, // Date d'arrosage sélectionnée
      watering_history: [lastWateredDate], // On initialise l'historique avec cette date
      snooze_days: 0,
    }).select().single();

    if (dbError) throw dbError;

    // On stocke l'ID pour l'utiliser en dehors du try...catch
    newPlantId = newPlant.id;

  } catch (error) {
    console.error("Unexpected Error:", error);
    return { error: "Une erreur inattendue est survenue." };
  }

  // REDIRECTION
  revalidatePath("/dashboard");
  
  if (newPlantId) {
    redirect(`/dashboard/plant/${newPlantId}`);
  } else {
    redirect("/dashboard");
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

    // 2. On interroge Gemini uniquement avec du texte
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
