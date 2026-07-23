'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash2, X, Plus, ImageIcon } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

const initialForm = {
  name: '',
  price: '',
  description: '',
  sizes: 'Standard',
  stock: '',
};

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  sizes: string[];
  stock: number;
}

export default function AdminUploadPage() {
  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({
    type: 'idle',
    message: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isConfigured = useMemo(() => Boolean(supabase), []);

  const fetchProducts = async () => {
    if (!supabase) return;

    try {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error.message || error);
      } else {
        setProducts((data || []) as Product[]);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (supabase) {
      fetchProducts();
    }
  }, []);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      sizes: (product.sizes || []).join(','),
      stock: (product.stock || 0).toString(),
    });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(initialForm);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      setStatus({
        type: 'error',
        message: 'Supabase is not configured yet. Add your public URL and anon key to continue.',
      });
      return;
    }

    if (!editingId && !selectedFile) {
      setStatus({
        type: 'error',
        message: 'Please select a photo to upload before saving the product.',
      });
      return;
    }

    if (!form.name.trim() || !form.price.trim() || !form.stock.trim()) {
      setStatus({
        type: 'error',
        message: 'Please provide a product name, price, and available stock.',
      });
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (isNaN(price) || price < 0) {
      setStatus({ type: 'error', message: 'Enter a valid price.' });
      return;
    }

    if (isNaN(stock) || stock < 0) {
      setStatus({ type: 'error', message: 'Enter a valid stock number.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      let publicUrl = editingId ? products.find(s => s.id === editingId)?.image_url : '';

      if (selectedFile) {
        const BUCKET_NAME = 'apexstores-assets';
        const filePath = `products/${Date.now()}-${selectedFile.name.replace(/\s+/g, '-')}`;

        const uploadResult = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadResult.error) throw uploadResult.error;

        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }

      const productData = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim() || null,
        image_url: publicUrl,
        sizes: form.sizes.split(',').map((s) => s.trim()).filter((s) => s),
        stock: Number(form.stock),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingId);

        if (updateError) throw updateError;
        setStatus({ type: 'success', message: 'Product updated successfully!' });
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData]);

        if (insertError) throw insertError;
        setStatus({ type: 'success', message: 'Product uploaded successfully!' });
      }

      setForm(initialForm);
      setSelectedFile(null);
      setEditingId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchProducts();

    } catch (error: any) {
      console.error('Save error:', error);
      setStatus({
        type: 'error',
        message: error.message || 'Something went wrong while saving your product.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!supabase) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      setDeleteConfirm(null);
      setStatus({ type: 'success', message: 'Product deleted successfully!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Error deleting product.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 text-left">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {editingId ? 'Edit Product' : 'Inventory Management'}
            </h1>
            <p className="text-slate-500 text-sm">
              {editingId ? `Updating details for item #${editingId}` : 'Add and manage your electronics and accessories.'}
            </p>
          </div>
          {editingId && (
            <Button variant="outline" onClick={cancelEditing} className="rounded-xl flex items-center gap-2 border-slate-200">
              <X className="h-4 w-4" /> Cancel Edit
            </Button>
          )}
        </div>

        {!isConfigured && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-medium">
            Supabase is not configured. Database actions will fail.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6 text-left">
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm sticky top-8"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                {editingId ? 'Update Product' : 'Upload New Item'}
              </h2>

              <div className="space-y-4 text-left">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Product name</label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="e.g. AirPods Pro Gen 2"
                    className="rounded-xl border-slate-100"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Price (Ksh)</label>
                    <Input
                      name="price"
                      type="number"
                      value={form.price}
                      onChange={handleInputChange}
                      placeholder="25000"
                      className="rounded-xl border-slate-100"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Stock</label>
                    <Input
                      name="stock"
                      type="number"
                      value={form.stock}
                      onChange={handleInputChange}
                      placeholder="50"
                      className="rounded-xl border-slate-100"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label>
                  <Textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Technical specs, battery life, compatibility..."
                    rows={4}
                    className="rounded-xl border-slate-100 resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Variants (e.g. Color)</label>
                  <Input
                    name="sizes"
                    value={form.sizes}
                    onChange={handleInputChange}
                    placeholder="White, Black, Space Gray..."
                    className="rounded-xl border-slate-100"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Product Image</label>
                  <div className="mt-1 flex flex-col gap-3">
                    {editingId && !selectedFile && (
                      <div className="text-[10px] text-primary font-bold uppercase bg-primary/5 p-2 rounded-lg border border-primary/10">
                        Current image will be kept unless you upload a new one.
                      </div>
                    )}
                    <div className="relative group cursor-pointer border-2 border-dashed border-slate-100 rounded-xl p-4 transition-colors hover:border-primary/50 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium text-slate-500">
                        {selectedFile ? selectedFile.name : 'Drop image or click to browse'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <Button type="submit" disabled={isSubmitting || !isConfigured} className="w-full rounded-xl py-6 font-bold shadow-lg">
                    {isSubmitting ? 'Processing...' : editingId ? 'Save Changes' : 'Upload Product'}
                  </Button>

                  {status.message && (
                    <div className={`p-3 rounded-xl text-xs font-bold ${
                      status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {status.message}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Table Section */}
          <div className="lg:col-span-3 text-left">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Catalog</h2>
              </div>

              {loadingProducts ? (
                <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : products.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium italic">Your product catalog is empty.</div>
              ) : (
                <div className="overflow-x-auto text-left">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <th className="px-6 py-4">Item</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-left">
                      {products.map((product) => (
                        <tr key={product.id} className={cn(
                          "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors",
                          editingId === product.id && "bg-primary/5"
                        )}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4 text-left">
                              <img src={product.image_url} alt="" className="h-12 w-12 rounded-xl object-cover bg-slate-100" />
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-slate-900 dark:text-white leading-none">{product.name}</span>
                                <span className="text-[10px] text-slate-500 mt-1 font-medium">#{product.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                            {formatPrice(product.price)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
                              product.stock > 10 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                            )}>
                              {product.stock} left
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 hover:text-primary transition-all"
                                onClick={() => startEditing(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              {deleteConfirm === product.id ? (
                                <div className="flex gap-1">
                                  <Button size="sm" className="h-8 px-2 bg-rose-600 text-white text-[10px] font-black uppercase" onClick={() => handleDeleteProduct(product.id)} disabled={isDeleting}>
                                    {isDeleting ? '...' : 'Fix'}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-8 px-2 text-[10px] font-bold uppercase" onClick={() => setDeleteConfirm(null)}>
                                    No
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                                  onClick={() => setDeleteConfirm(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
