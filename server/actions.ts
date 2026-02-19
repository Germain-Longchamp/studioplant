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
  const description = formData.get("description") as string;
  
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

    const prompt = `
      Analyse cette photo de plante. 
      L'utilisateur indique qu'elle est située ici : ${room || "Non précisé"}.
      La luminosité de la pièce est : ${light || "Non précisée"}.
      Note de l'utilisateur : ${description || "Aucune"}.

      Retourne UNIQUEMENT un objet JSON valide avec la structure suivante (SANS balises markdown) :
      {
        "name": "Nom commun (ex: Monstera)",
        "species": "Nom scientifique",
        "watering_frequency": 7,
        "care_notes": "Une courte phrase de conseil d'entretien ADAPTÉE à la pièce et la luminosité fournies."
      }
      Si ce n'est pas une plante, retourne exactement : {"name": "Erreur", "species": "Non reconnu", "watering_frequency": 0, "care_notes": "Ceci ne semble pas être une plante."}
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

    // MODIFICATION ICI : On ajoute .select().single() pour récupérer la ligne fraîchement créée
    const { data: newPlant, error: dbError } = await supabase.from("plants").insert({
      user_id: user.id,
      name: plantData.name,
      species: plantData.species,
      watering_frequency: plantData.watering_frequency,
      exposure: light,
      room: room,
      description: description,
      care_notes: plantData.care_notes,
      image_path: publicUrlData.publicUrl,
      last_watered_at: new Date().toISOString(),
    }).select().single();

    if (dbError) throw dbError;

    // On stocke l'ID pour l'utiliser en dehors du try...catch
    newPlantId = newPlant.id;

  } catch (error) {
    console.error("Unexpected Error:", error);
    return { error: "Une erreur inattendue est survenue." };
  }

  // REDIRECTION (en dehors du bloc catch pour que Next.js puisse faire son travail proprement)
  // On met à jour le cache du dashboard de toute façon
  revalidatePath("/dashboard");
  
  // Si on a bien l'ID, direction la page de la plante ! Sinon, retour à l'accueil
  if (newPlantId) {
    redirect(`/dashboard/plant/${newPlantId}`);
  } else {
    redirect("/dashboard");
  }
}

export async function waterPlant(plantId: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("plants")
      .update({ last_watered_at: new Date().toISOString() })
      .eq("id", plantId);

    if (error) return { error: "Erreur d'arrosage." };

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Erreur inattendue." };
  }
}


export async function deletePlant(plantId: string, imageUrl: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Non autorisé" };

  try {
    // 1. Supprimer l'image du bucket Storage (si elle existe)
    if (imageUrl) {
      // On extrait le nom du fichier à la fin de l'URL
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
      .eq("user_id", user.id); // Sécurité supplémentaire

    if (error) return { error: "Erreur lors de la suppression en base de données." };

  } catch (error) {
    console.error("Delete Error:", error);
    return { error: "Une erreur inattendue est survenue." };
  }

  // 3. Rafraîchir le cache et rediriger vers l'accueil
  revalidatePath("/dashboard");
  redirect("/dashboard");
}