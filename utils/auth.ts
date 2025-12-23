import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";


export const signOut = async (router: ReturnType<typeof useRouter>) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Erreur lors de la déconnexion :", error.message);
    }
  } catch (err) {
    console.error("Erreur inattendue :", err);
  } finally {
    router.replace("/auth/login");
  }
};