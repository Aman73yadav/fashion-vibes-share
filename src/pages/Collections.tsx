import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { FolderHeart, Plus } from 'lucide-react';

export default function Collections() {
  const [collections, setCollections] = useState<any[]>([]);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user]);

  const loadCollections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('collections')
      .select('*, collection_items(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading collections:', error);
      return;
    }

    setCollections(data || []);
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('collections').insert({
      user_id: user.id,
      name: newCollection.name,
      description: newCollection.description,
      is_public: newCollection.isPublic,
    });

    if (error) {
      toast.error('Failed to create collection');
      return;
    }

    toast.success('Collection created!');
    setNewCollection({ name: '', description: '', isPublic: true });
    setDialogOpen(false);
    loadCollections();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderHeart className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">My Collections</h1>
            </div>
            <p className="text-muted-foreground">
              Organize your favorite items into custom style boards
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Collection Name</Label>
                  <Input
                    id="name"
                    value={newCollection.name}
                    onChange={(e) =>
                      setNewCollection({ ...newCollection, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCollection.description}
                    onChange={(e) =>
                      setNewCollection({ ...newCollection, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="public"
                    checked={newCollection.isPublic}
                    onCheckedChange={(checked) =>
                      setNewCollection({ ...newCollection, isPublic: checked })
                    }
                  />
                  <Label htmlFor="public">Make collection public</Label>
                </div>
                <Button type="submit" className="w-full">
                  Create Collection
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-16">
            <FolderHeart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first collection to organize your favorite items
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Collection
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card key={collection.id} className="hover:shadow-hover transition-shadow">
                <CardHeader>
                  <CardTitle>{collection.name}</CardTitle>
                  <CardDescription>
                    {collection.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {collection.collection_items?.[0]?.count || 0} items
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {collection.is_public ? 'Public' : 'Private'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
