import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's favorites and search history
    const { data: favorites } = await supabase
      .from('user_favorites')
      .select('products(*)')
      .eq('user_id', user.id)
      .limit(10);

    const { data: searches } = await supabase
      .from('search_history')
      .select('query')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const favoriteItems = favorites?.map((f: any) => f.products).filter(Boolean) || [];
    const searchQueries = searches?.map((s: any) => s.query) || [];

    // Build context for AI
    const context = `User's favorite items: ${favoriteItems.map((p: any) => `${p.name} (${p.tags?.join(', ')})`).join('; ')}. 
Recent searches: ${searchQueries.join(', ')}.`;

    // Call Lovable AI for recommendations
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a fashion stylist. Based on user preferences, suggest product tags/keywords they would like. Return ONLY a JSON array of 5-8 style tags, nothing else.' 
          },
          { role: 'user', content: context }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI request failed');
    }

    const aiData = await aiResponse.json();
    const suggestedTags = JSON.parse(aiData.choices[0].message.content);

    // Get all products
    const { data: allProducts } = await supabase
      .from('products')
      .select('*');

    // Score products based on tag matches
    const scoredProducts = allProducts?.map((product: any) => {
      const matchCount = product.tags?.filter((tag: string) => 
        suggestedTags.some((suggested: string) => 
          tag.toLowerCase().includes(suggested.toLowerCase()) ||
          suggested.toLowerCase().includes(tag.toLowerCase())
        )
      ).length || 0;
      
      const isFavorite = favoriteItems.some((f: any) => f.id === product.id);
      return { ...product, score: matchCount, isFavorite };
    }) || [];

    // Sort by score and filter out favorites
    const recommendations = scoredProducts
      .filter(p => !p.isFavorite && p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return new Response(JSON.stringify({ recommendations, suggestedTags }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
