import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import heroBg from '@/assets/hero-bg.jpg';
import product1 from '@/assets/product-1.jpg';
import product2 from '@/assets/product-2.jpg';
import product3 from '@/assets/product-3.jpg';
import product4 from '@/assets/product-4.jpg';
import product5 from '@/assets/product-5.jpg';
import product6 from '@/assets/product-6.jpg';

// Sample products data - will be replaced with DB data
const sampleProducts = [
  {
    id: '1',
    name: 'Bohemian Sunset Dress',
    description: 'Flowy maxi dress in warm earthy tones with intricate patterns. Perfect for festival vibes.',
    price: 89.99,
    image_url: product1,
    tags: ['boho', 'festival', 'relaxed'],
  },
  {
    id: '2',
    name: 'Urban Edge Leather Jacket',
    description: 'Sleek black leather jacket with asymmetric zipper and silver hardware.',
    price: 249.99,
    image_url: product2,
    tags: ['edgy', 'urban', 'bold'],
  },
  {
    id: '3',
    name: 'Cozy Cashmere Sweater',
    description: 'Luxuriously soft oversized cashmere in warm cream. Ultimate comfort meets sophistication.',
    price: 179.99,
    image_url: product3,
    tags: ['cozy', 'elegant', 'minimalist'],
  },
  {
    id: '4',
    name: 'Athletic Joggers',
    description: 'Navy athletic joggers with modern sporty casual style.',
    price: 69.99,
    image_url: product4,
    tags: ['sporty', 'casual', 'modern'],
  },
  {
    id: '5',
    name: 'Classic White Shirt',
    description: 'Crisp white button-up shirt with clean lines. Minimalist professional style.',
    price: 79.99,
    image_url: product5,
    tags: ['classic', 'professional', 'minimalist'],
  },
  {
    id: '6',
    name: 'Vintage Denim Jacket',
    description: 'Distressed denim jacket with vintage cool aesthetic.',
    price: 129.99,
    image_url: product6,
    tags: ['vintage', 'casual', 'cool'],
  },
];

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    loadProducts();
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
      setProducts(sampleProducts);
    } else if (data && data.length > 0) {
      setProducts(data);
    } else {
      setProducts(sampleProducts);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_favorites')
      .select('product_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading favorites:', error);
      return;
    }

    setFavorites(new Set(data.map((f) => f.product_id)));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      loadProducts();
      return;
    }

    if (user) {
      await supabase
        .from('search_history')
        .insert({ user_id: user.id, query: searchQuery });
    }

    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    setProducts(filtered.length > 0 ? filtered : products);
    if (filtered.length === 0) {
      toast.info('No exact matches found, showing all products');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative h-[500px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-primary-foreground">
            Discover Your Style
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8">
            AI-powered fashion recommendations tailored to your unique taste
          </p>
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Describe your vibe... (e.g., 'elegant evening wear')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-12 bg-background/95 backdrop-blur"
              />
              <Button type="submit" size="lg" className="gap-2">
                <Search className="h-5 w-5" />
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Products Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Product Catalog</h2>
          <p className="text-muted-foreground">
            Browse our curated collection of fashion items
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
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
    </div>
  );
}
