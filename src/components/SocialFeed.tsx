import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export const SocialFeed = () => {
  const [publicCollections, setPublicCollections] = useState<any[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    loadPublicCollections();
    if (user) loadFollowing();
  }, [user]);

  const loadPublicCollections = async () => {
    const { data, error } = await supabase
      .from('collections')
      .select('*, profiles(username, id), collection_items(count)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(12);

    if (!error && data) {
      setPublicCollections(data);
    }
  };

  const loadFollowing = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);
    setFollowing(new Set(data?.map(f => f.following_id) || []));
  };

  const handleFollow = async (userId: string) => {
    if (!user) {
      toast.error('Please sign in to follow users');
      return;
    }

    const isFollowing = following.has(userId);
    
    if (isFollowing) {
      await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);
      toast.success('Unfollowed');
    } else {
      await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: userId });
      toast.success('Following!');
    }
    
    loadFollowing();
  };

  if (publicCollections.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-center gap-3 mb-8">
        <Users className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-3xl font-bold">Discover Collections</h2>
          <p className="text-muted-foreground">Explore curated styles from the community</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publicCollections.map((collection) => (
          <Card key={collection.id} className="hover:shadow-hover transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {collection.profiles?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{collection.profiles?.username || 'User'}</p>
                  </div>
                </div>
                {user && user.id !== collection.user_id && (
                  <Button
                    size="sm"
                    variant={following.has(collection.user_id) ? 'secondary' : 'default'}
                    onClick={() => handleFollow(collection.user_id)}
                    className="gap-1"
                  >
                    {following.has(collection.user_id) ? (
                      <><UserMinus className="h-3 w-3" /> Following</>
                    ) : (
                      <><UserPlus className="h-3 w-3" /> Follow</>
                    )}
                  </Button>
                )}
              </div>
              <CardTitle className="mt-2">{collection.name}</CardTitle>
              <CardDescription>{collection.description || 'No description'}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {collection.collection_items?.[0]?.count || 0} items
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
