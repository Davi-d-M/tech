export interface Product {
  id: number;
  name: string;
  price: number;
  old_price?: number;
  image?: string;
  image_url?: string;
  description?: string;
  category?: string;
  rating?: number;
  is_new?: boolean;
  stock?: number;
  sizes?: string[];
  variant_stock?: Record<string, number>;
  tech_specs?: Record<string, string>;
}
