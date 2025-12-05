import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export const signOut = async (router: ReturnType<typeof useRouter>) => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Erreur lors de la déconnexion :", error.message);
    return;
  }

  // Rediriger vers la page de login
  router.push("/auth/login");
};
