import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

// Initialisation de Groq avec ta clé secrète
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    // 1. Récupérer le texte envoyé par le front-end
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ result: "OK" }); // Rien à analyser
    }

    // 2. Appel à Groq avec un modèle ultra-rapide (8b)
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { 
          role: "system", 
          content: `Tu es un modérateur automatique. 
          Analyse le texte fourni. 
          - Si le texte contient des insultes, de la haine, de la violence ou du contenu sexuel : réponds uniquement 'BLOCKED'.
          - Sinon : réponds uniquement 'OK'.
          Ne fais pas de phrases, réponds juste par l'un de ces deux mots.` 
        },
        { role: "user", content: text }
      ],
      temperature: 0.1, // On met 0.1 pour que la réponse soit toujours la même (stable)
      max_tokens: 5,    // On limite à 5 tokens car on ne veut qu'un seul mot
    });

    // 3. Nettoyage de la réponse
    const decision = response.choices[0].message.content?.trim().toUpperCase();

    // 4. Renvoi du résultat au front-end
    // On vérifie si le mot 'BLOCKED' est présent dans la réponse pour être sûr
    if (decision?.includes("BLOCKED")) {
      return NextResponse.json({ result: "BLOCKED" });
    }

    return NextResponse.json({ result: "OK" });

  } catch (error) {
    console.error("Erreur API Modération:", error);
    // Sécurité : si l'IA bug, on renvoie "OK" pour ne pas bloquer les utilisateurs légitimes
    return NextResponse.json({ result: "OK" }, { status: 200 });
  }
}