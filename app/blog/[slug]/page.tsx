import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '@/lib/supabaseClient';
import BlogClient from './BlogClient';
import { notFound } from 'next/navigation';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  author: string;
  created_at: string;
}

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: BlogPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  if (!supabase) return {};

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!post) {
    return {
      title: 'Guide Not Found | Apexstores',
    };
  }

  const typedPost = post as BlogPost;
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${typedPost.title} | Tech Library | Apexstores`,
    description: typedPost.excerpt || typedPost.title,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/blog/${slug}`,
    },
    openGraph: {
      title: typedPost.title,
      description: typedPost.excerpt,
      images: [typedPost.image_url || '', ...previousImages],
      type: 'article',
    },
  };
}

export default async function BlogDetailPage({ params }: BlogPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  if (!supabase) return notFound();

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !post) {
    return notFound();
  }

  return <BlogClient post={post as BlogPost} />;
}
