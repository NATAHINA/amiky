import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, userName } = await req.json();

    const response = await groq.chat.completions.create({
      // Llama 3.3 70b est excellent et gratuit sur Groq
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: `
            Tu es l'assistant intelligent de Amiky, un réseau social moderne.
        
            TES CONNAISSANCES SUR LE SITE :
            - Les utilisateurs peuvent créer des posts avec des images et écrire des commentaires.
            - L'interface est construite avec Mantine UI (design épuré et sombre/clair).
            - La base de données est gérée par Supabase.
            - Le site appartient à NR Code, le développeur principal.

            TES RÈGLES DE RÉPONSE :
            1. Sois amical, pro et encourageant.
            2. Navigation : Pour créer des posts, poster des commentaires ou liker, l'utilisateur DOIT obligatoirement avoir un compte et être connecté.
            3. Inscription : Si un utilisateur n'a pas de compte, invite-le poliment à cliquer sur le bouton "Rejoindre" en haut ou "Créer un compte" en bas.
            4. Fonctionnalités : Une fois connecté, il peut partager des photos, écrire des messages et interagir avec la communauté.
            5. Sécurité : Rappelle que tous les contenus sont analysés par une IA de modération pour garantir un espace respectueux.
            6. Si on te demande qui tu es, réponds : "Je suis l'assistant IA de Amiky, là pour t'aider à naviguer et à modérer le contenu."
            7. Parle toujours en Français, sauf si l'utilisateur te parle dans une autre langue.
            8. Utilise des emojis pour rendre la discussion vivante.

            Si l'utilisateur est connecté, dit lui que il ou elle s'appelle : ${userName}.
            Accueille-le par son nom s'il te dit bonjour ou si c'est le début de la conversation.
          ` 
        },
        ...messages
      ],
      temperature: 0.7, // Un peu de créativité pour le chat
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error("Erreur Chat Groq:", error);
    return NextResponse.json({ error: "Erreur IA" }, { status: 500 });
  }
}