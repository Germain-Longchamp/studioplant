"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      // --- LOGIQUE D'INSCRIPTION (Sans confirmation d'email) ---
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Compte créé avec succès ! Bienvenue.");
        // Plus besoin de vider le mdp ou d'attendre, on est connecté !
        router.push("/dashboard");
        router.refresh(); 
      }
    } else {
      // --- LOGIQUE DE CONNEXION ---
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Identifiants incorrects.");
      } else {
        toast.success("Connexion réussie !");
        router.push("/dashboard");
        router.refresh();
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-green-100 rounded-full">
              <Leaf className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Créer un compte" : "Bon retour"}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Rejoignez Studio Plantes pour suivre votre jardin." 
              : "Connectez-vous à votre espace Studio Plantes."}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="prenom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6} 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={isLoading}
            >
              {isLoading 
                ? "Chargement..." 
                : isSignUp ? "M'inscrire" : "Me connecter"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-4">
          <Button
            variant="ghost"
            className="text-sm text-muted-foreground"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp 
              ? "Déjà un compte ? Se connecter" 
              : "Pas encore de compte ? S'inscrire"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}