import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { record } = await req.json() // Le post qui vient d'être créé

  // 1. Appel à l'IA de modération (Sightengine)
  const params = new URLSearchParams({
    'api_user': '1803615180',
    'api_secret': 'p3zArwKKiAM6zy4ZGaM8HctYj9cFtZzC',
    'models': 'nudity,wad', // wad = Weapons, Alcohol, Drugs (et pubs interdites)
    'url': record.image_url
  })

  const response = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`)
  const data = await response.json()

  // 2. Si le score de nudité ou de contenu interdit est élevé
  if (data.nudity.raw >= 0.5 || data.weapon >= 0.5) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // On marque le post comme NSFW ou on le supprime
    await supabase
      .from('posts')
      .update({ is_nsfw: true})
      .eq('id', record.id)
  }

  return new Response(JSON.stringify({ done: true }), { headers: { "Content-Type": "application/json" } })
})