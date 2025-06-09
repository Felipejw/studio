
// src/app/admin/store-products/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/components/auth-provider';
import { db, collection, addDoc, getDocs, Timestamp, query, orderBy as firestoreOrderBy, doc, updateDoc, deleteDoc } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, PackagePlus, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';

const productTypes = ['Curso', 'Livro', 'Estratégia', 'Indicador', 'Outro'] as const;
type ProductType = typeof productTypes[number];

const productSchema = z.object({
  name: z.string().min(3, { message: "Nome do produto é obrigatório (mín. 3 caracteres)." }),
  type: z.enum(productTypes, { required_error: "Tipo do produto é obrigatório." }),
  description: z.string().min(10, { message: "Descrição completa é obrigatória (mín. 10 caracteres)." }),
  shortDescription: z.string().min(5, { message: "Descrição curta é obrigatória (mín. 5 caracteres)." }).max(150, { message: "Descrição curta deve ter no máximo 150 caracteres." }),
  purchaseUrl: z.string().url({ message: "URL de compra inválida." }),
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).optional().or(z.literal('')),
  price: z.coerce.number().positive({ message: "Preço deve ser um número positivo." }),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface StoreProduct extends ProductFormValues {
  id: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export default function AdminStoreProductsPage() {
  const { user, authLoading, userProfile, profileLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<StoreProduct | null>(null);


  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      type: 'Curso',
      description: '',
      shortDescription: '',
      purchaseUrl: '',
      imageUrl: '',
      price: 0,
    },
  });

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const q = query(collection(db, 'store_products'), firestoreOrderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedProducts: StoreProduct[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedProducts.push({ id: docSnap.id, ...(docSnap.data() as Omit<StoreProduct, 'id'>) });
      });
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({ variant: "destructive", title: "Erro ao Carregar Produtos", description: "Não foi possível buscar os produtos." });
    }
    setIsLoadingProducts(false);
  }, [toast]);

  useEffect(() => {
    const overallLoading = authLoading || profileLoading;
    if (!overallLoading) {
      if (!user || userProfile?.email !== 'felipejw.fm@gmail.com') {
        toast({ variant: 'destructive', title: 'Acesso Negado' });
        router.replace('/dashboard');
      } else {
        fetchProducts();
      }
    }
  }, [user, userProfile, authLoading, profileLoading, router, toast, fetchProducts]);

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        // Update existing product
        const productRef = doc(db, 'store_products', editingProduct.id);
        await updateDoc(productRef, { ...data, updatedAt: Timestamp.now() });
        toast({ title: 'Produto Atualizado!', description: `${data.name} foi atualizado.` });
      } else {
        // Add new product
        await addDoc(collection(db, 'store_products'), { ...data, createdAt: Timestamp.now() });
        toast({ title: 'Produto Adicionado!', description: `${data.name} foi adicionado à loja.` });
      }
      form.reset();
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error("Error saving product:", error);
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar o produto." });
    }
    setIsSubmitting(false);
  };

  const handleEdit = (product: StoreProduct) => {
    setEditingProduct(product);
    form.reset(product);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsSubmitting(true); // Reuse for delete loading state
    try {
      await deleteDoc(doc(db, 'store_products', productToDelete.id));
      toast({ title: 'Produto Excluído!', description: `${productToDelete.name} foi removido da loja.` });
      setProductToDelete(null);
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ variant: "destructive", title: "Erro ao Excluir", description: "Não foi possível excluir o produto." });
    }
    setIsSubmitting(false);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    form.reset({
      name: '', type: 'Curso', description: '', shortDescription: '',
      purchaseUrl: '', imageUrl: '', price: 0,
    });
    setIsModalOpen(true);
  };


  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  if (!userProfile || userProfile.email !== 'felipejw.fm@gmail.com') return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-2">
            <PackagePlus className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold font-headline">Gerenciar Produtos da Loja</h1>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Painel Admin
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4 md:px-6">
        <div className="mb-6 flex justify-end">
          <Button onClick={openAddModal}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Produto
          </Button>
        </div>

        <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) {
            setEditingProduct(null);
            form.reset();
          }
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-headline">{editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem><FormLabel>Tipo do Produto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                      <SelectContent>{productTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="shortDescription" render={({ field }) => (
                  <FormItem><FormLabel>Descrição Curta (para card da loja)</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Descrição Completa</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="purchaseUrl" render={({ field }) => (
                  <FormItem><FormLabel>URL de Compra</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem><FormLabel>URL da Imagem de Capa (Opcional)</FormLabel><FormControl><Input type="url" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog>
            <Card>
            <CardHeader><CardTitle>Produtos Cadastrados</CardTitle></CardHeader>
            <CardContent>
                {isLoadingProducts ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Carregando...</p></div>
                ) : products.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">Nenhum produto cadastrado.</p>
                ) : (
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Imagem</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Preço (R$)</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell>
                            <Image
                                src={product.imageUrl || `https://placehold.co/64x64.png?text=${product.name.charAt(0)}`}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded object-cover h-10 w-10"
                                data-ai-hint="product image"
                            />
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.type}</TableCell>
                            <TableCell>{product.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(product)}><Edit className="mr-1 h-3 w-3" />Editar</Button>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" onClick={() => setProductToDelete(product)}><Trash2 className="mr-1 h-3 w-3" />Excluir</Button>
                            </AlertDialogTrigger>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    <TableCaption>Total de produtos: {products.length}</TableCaption>
                    </Table>
                </div>
                )}
            </CardContent>
            </Card>
             {productToDelete && (
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                        Tem certeza que deseja excluir o produto "{productToDelete.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setProductToDelete(null)} disabled={isSubmitting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Exclusão"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            )}
        </AlertDialog>
      </main>
    </div>
  );
}

    