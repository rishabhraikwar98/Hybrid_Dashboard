'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createProduct } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

export default function AddProductForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // ── Client-side validation ─────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!form.name.trim())        errs.name        = 'Name is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.category)           errs.category    = 'Category is required';

    const price = Number(form.price);
    if (form.price === '')        errs.price = 'Price is required';
    else if (isNaN(price))        errs.price = 'Price must be a number';
    else if (price < 0)           errs.price = 'Price must be 0 or greater';

    const stock = Number(form.stock);
    if (form.stock === '')        errs.stock = 'Stock is required';
    else if (isNaN(stock))        errs.stock = 'Stock must be a number';
    else if (stock < 0)           errs.stock = 'Stock must be 0 or greater';
    else if (!Number.isInteger(stock)) errs.stock = 'Stock must be a whole number';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await createProduct({
        name:        form.name.trim(),
        description: form.description.trim(),
        price:       Number(form.price),
        category:    form.category,
        stock:       Number(form.stock),
      });
      toast.success('Product created successfully');
      router.push('/products');
      router.refresh(); // 5.4 — invalidate server cache so list shows new product
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Product Details</CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            placeholder="e.g. Premium Sneaker"
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
            placeholder="Describe the product..."
            value={form.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
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

        {/* Price + Stock side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price ($) <span className="text-red-500">*</span></Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
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
              placeholder="0"
              value={form.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              className={errors.stock ? 'border-red-500' : ''}
            />
            {errors.stock && <p className="text-xs text-red-500">{errors.stock}</p>}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Product'}
        </Button>
      </CardFooter>
    </Card>
  );
}