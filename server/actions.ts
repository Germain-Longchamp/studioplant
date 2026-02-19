"use server";

import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// 1. Initialisation de Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function addPlantWithAI(formData: FormData) {
  // 1. Récupérer l'image depuis le formulaire frontend
  const imageFile = formData.get("image") as File;
  
  if (!imageFile || imageFile.size === 0) {
    return { error: "Aucune image fournie." };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: "Non autorisé" };
    }

    // 2. Préparer l'image pour Gemini (conversion en base64)
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: imageFile.type,
      },
    };

    // 3. Appel à Gemini (ON UTILISE LE MODÈLE QUI FONCTIONNE AVEC TA CLÉ)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // 👈 La magie est ici !
    });

    const prompt = `
      Analyse cette photo de plante d'intérieur. 
      Retourne UNIQUEMENT un objet JSON valide avec la structure suivante (SANS AUCUN texte autour, ni balises markdown) :
      {
        "name": "Nom commun de la plante (ex: Monstera)",
        "species": "Nom scientifique complet",
        "watering_frequency": 7,
        "exposure": "Soleil direct",
        "care_notes": "Une courte phrase de conseil d'entretien"
      }
      Si ce n'est pas une plante, retourne exactement : {"name": "Erreur", "species": "Non reconnu", "watering_frequency": 0, "exposure": "Inconnu", "care_notes": "Ceci ne semble pas être une plante."}
    `;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    
    // 4. Parser la réponse de l'IA (Nettoyage de sécurité)
    const cleanedText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const plantData = JSON.parse(cleanedText);

    if (plantData.name === "Erreur") {
      return { error: "L'IA n'a pas reconnu de plante sur cette photo." };
    }

    // 5. Sauvegarder l'image dans Supabase Storage
    const fileExtension = imageFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from("plant-images")
      .upload(fileName, imageFile);

    if (storageError) {
      console.error("Storage Error:", storageError);
      return { error: "Erreur lors de la sauvegarde de l'image." };
    }

    // Récupérer l'URL publique de l'image
    const { data: publicUrlData } = supabase.storage
      .from("plant-images")
      .getPublicUrl(fileName);

    // 6. Sauvegarder les données de la plante dans Supabase DB
    const { error: dbError } = await supabase.from("plants").insert({
      user_id: user.id,
      name: plantData.name,
      species: plantData.species,
      watering_frequency: plantData.watering_frequency,
      exposure: plantData.exposure,
      care_notes: plantData.care_notes,
      image_path: publicUrlData.publicUrl,
      last_watered_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("DB Error:", dbError);
      return { error: "Erreur lors de la sauvegarde en base de données." };
    }

  } catch (error) {
    console.error("Unexpected Error:", error);
    return { error: "Une erreur inattendue est survenue lors de l'analyse ou de la sauvegarde." };
  }

  // 7. Si tout s'est bien passé, on vide le cache du dashboard et on redirige
  revalidatePath("/dashboard");
  redirect("/dashboard");
}