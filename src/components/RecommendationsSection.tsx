import { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { Button } from './ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const RecommendationsSection = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRecommendations();
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_favorites')
      .select('product_id')
      .eq('user_id', user.id);
    setFavorites(new Set(data?.map(f => f.product_id) || []));
  };

  const loadRecommendations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommendations', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setRecommendations(data.recommendations || []);
    } catch (error: any) {
      if (error.message?.includes('429')) {
        toast.error('Rate limit reached. Please try again later.');
      } else {
        toast.error('Failed to load recommendations');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || recommendations.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16 bg-gradient-card rounded-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-primary" />
          <div>
            <h2 className="text-3xl font-bold">Recommended For You</h2>
            <p className="text-muted-foreground">AI-curated picks based on your style</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadRecommendations} 
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description}
            price={product.price}
            imageUrl={product.image_url}
            tags={product.tags || []}
            isFavorite={favorites.has(product.id)}
            onFavoriteToggle={loadFavorites}
          />
        ))}
      </div>
    </section>
  );
};
