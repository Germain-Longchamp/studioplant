"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Leaf, Sprout, MapPin, ArrowRight, X, Sparkles, 
  Cloud, SunDim, Sun, Thermometer, DoorOpen, Camera, CheckCircle, Loader2 
} from "lucide-react";
import { saveRoom } from "@/server/actions";

// 🟢 1. On ajoute la prop "show"
export default function NewUserOnboarding({ show }: { show: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // 🟢 2. On utilise une référence pour mémoriser qu'on l'a déjà ouvert
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Si on doit l'afficher et qu'on ne l'a pas encore fait
    if (show && !hasTriggered.current) {
      hasTriggered.current = true;
      const timer = setTimeout(() => setIsOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const [orientations, setOrientations] = useState<string[]>([]);
  const [lightLevel, setLightLevel] = useState("Moyenne");

  if (!isOpen) return null;

  // ... [LE RESTE DE TON CODE RESTE EXACTEMENT IDENTIQUE (toggleOrientation, handleSaveRoom, return...)]
