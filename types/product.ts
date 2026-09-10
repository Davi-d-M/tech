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
  is_featured?: boolean;
  stock?: number;
  sizes?: string[];
  variant_stock?: Record<string, number>;
  tech_specs?: Record<string, string>;
  model_url?: string;
  auto_rotate?: boolean;
  rotation_speed?: number;
  hotspots?: { id: string; position: [number, number, number]; title: string; description: string }[];
}
