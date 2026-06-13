'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateProduct, deleteProduct } from '@/lib/api';
import { Product } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = ['Footwear', 'Electronics', 'Clothing', 'Accessories'];

interface FormData {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  price?: string;
  category?: string;
  stock?: string;
}

interface Props {
  product: Product;
}

export default function EditProductForm({ product }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name:        product.name,
    description: product.description,
    price:       String(product.price),
    category:    product.category,
    stock:       String(product.stock),
  });

  const [errors, setErrors]           = useState<FormErrors>({});
  const [loading, setLoading]         = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Client-side validation ─────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!form.name.trim())        errs.name        = 'Name is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category)           errs.category    = 'Category is required';

    const price = Number(form.price);
    if (form.price === '')             errs.price = 'Price is required';
    else if (isNaN(price))             errs.price = 'Price must be a number';
    else if (price < 0)                errs.price = 'Price must be 0 or greater';

    const stock = Number(form.stock);
    if (form.stock === '')             errs.stock = 'Stock is required';
    else if (isNaN(stock))             errs.stock = 'Stock must be a number';
    else if (stock < 0)                errs.stock = 'Stock must be 0 or greater';
    else if (!Number.isInteger(stock)) errs.stock = 'Stock must be a whole number';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Save ──────────────────────────────────────────────────────────────
const handleSave = async () => {
  if (!validate()) return;
  setLoading(true);
  try {
    await updateProduct(product._id, {
      name:        form.name.trim(),
      description: form.description.trim(),
      price:       Number(form.price),
      category:    form.category,
      stock:       Number(form.stock),
      version:     product.version,
    });
    toast.success('Product updated successfully');
    router.push('/products');
    router.refresh();
  } catch (err: any) {
    if (err.status === 409) {
      // conflict detected
      toast.error('This product was updated elsewhere — please reload to see the latest version.');
    } else {
      toast.error(err.message || 'Failed to update product');
    }
  } finally {
    setLoading(false);
  }
};
  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteProduct(product._id);
      toast.success('Product deleted');
      router.push('/products');
      router.refresh(); // invalidate SSR cache
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Product Details</CardTitle>
          <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={errors.description ? 'border-red-500' : ''}
              rows={3}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category <span className="text-red-500">*</span></Label>
            <Select
              value={form.category}
              onValueChange={(v) => handleChange('category', v)}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price ($) <span className="text-red-500">*</span></Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock <span className="text-red-500">*</span></Label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className={errors.stock ? 'border-red-500' : ''}
              />
              {errors.stock && <p className="text-xs text-red-500">{errors.stock}</p>}
            </div>
          </div>

          {/* Meta info */}
          <div className="text-xs text-slate-400 pt-1 space-y-0.5">
            <p>ID: {product._id}</p>
            <p>Created: {new Date(product.createdAt).toLocaleDateString()}</p>
            <p>Version: {product.version}</p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={loading}
          >
            Delete
          </Button>
        </CardFooter>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}