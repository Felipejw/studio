
// src/app/(app)/store/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, ExternalLink, Tag, Info } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { db, collection, getDocs, Timestamp, query, orderBy as firestoreOrderBy } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';

const productTypes = ['Curso', 'Livro', 'Estratégia', 'Indicador', 'Outro'] as const;
type ProductType = typeof productTypes[number];

interface ProductData {
  name: string;
  type: ProductType;
  description: string;
  shortDescription: string;
  purchaseUrl: string;
  imageUrl?: string;
  price: number;
  createdAt: Timestamp;
}

interface StoreProduct extends ProductData {
  id: string;
}

export default function StorePage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const q = query(collection(db, 'store_products'), firestoreOrderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedProducts: StoreProduct[] = [];
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({ id: doc.id, ...(doc.data() as ProductData) });
      });
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products for store:", error);
      // Optionally, set an error state or show a toast
    }
    setIsLoadingProducts(false);
  }, []);

  useEffect(() => {
    if (!authLoading && user) { // Ensure user is loaded and exists
      fetchProducts();
    } else if (!authLoading && !user) {
      setIsLoadingProducts(false); // Stop loading if user is not authenticated
    }
  }, [authLoading, user, fetchProducts]);

  if (authLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3">Carregando loja...</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by AuthProvider redirecting to /login
    // Or you can show a message to log in
    return (
        <div className="container mx-auto py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
            <p className="mb-6">Você precisa estar logado para acessar a Loja do Trader.</p>
            <Button asChild><Link href="/login">Fazer Login</Link></Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-10">
        <ShoppingCart className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold font-headline">Loja do Trader</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Produtos digitais selecionados para aprimorar seu trading.
        </p>
      </div>

      {isLoadingProducts ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">Nenhum produto disponível no momento.</p>
          <p className="text-sm text-muted-foreground mt-2">Volte em breve para novidades!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="p-0 relative">
                <Image
                  src={product.imageUrl || `https://placehold.co/400x300.png?text=${encodeURIComponent(product.name)}`}
                  alt={product.name}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover"
                  data-ai-hint={`product ${product.type.toLowerCase()}`}
                />
              </CardHeader>
              <CardContent className="p-4 flex flex-col flex-grow">
                <CardTitle className="text-lg font-headline mb-1 truncate" title={product.name}>{product.name}</CardTitle>
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <Info className="h-3 w-3 mr-1" />
                  <span>{product.type}</span>
                </div>
                <CardDescription className="text-sm mb-3 flex-grow min-h-[60px]">
                  {product.shortDescription}
                </CardDescription>
                <div className="text-2xl font-bold text-primary mb-4">
                  R$ {product.price.toFixed(2)}
                </div>
                <Button asChild className="w-full mt-auto">
                  <a href={product.purchaseUrl} target="_blank" rel="noopener noreferrer">
                    Ver Detalhes / Comprar <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

    