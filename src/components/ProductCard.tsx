import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  tags: string[];
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export const ProductCard = ({
  id,
  name,
  description,
  price,
  imageUrl,
  tags,
  isFavorite = false,
  onFavoriteToggle,
}: ProductCardProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleFavoriteToggle = async () => {
    if (!user) {
      toast.error('Please sign in to add favorites');
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;
        toast.success('Removed from favorites');
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, product_id: id });

        if (error) throw error;
        toast.success('Added to favorites');
      }
      onFavoriteToggle?.();
    } catch (error) {
      toast.error('Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="group overflow-hidden border-border hover:shadow-hover transition-all duration-300">
      <div className="relative overflow-hidden aspect-[4/5]">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            size="icon"
            variant={isFavorite ? 'default' : 'secondary'}
            className="rounded-full shadow-elegant"
            onClick={handleFavoriteToggle}
            disabled={isLoading}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          {user && (
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-elegant"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <h3 className="font-semibold text-lg mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>
        <p className="font-bold text-primary text-lg">${price.toFixed(2)}</p>
      </CardContent>
    </Card>
  );
};
