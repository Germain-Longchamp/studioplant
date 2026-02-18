import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-4">
      <h1 className="text-4xl font-bold text-green-700">Studio Plantes</h1>
      <p className="text-muted-foreground">Mon jardin connecté</p>
      <Button>Commencer</Button>
    </main>
  );
}