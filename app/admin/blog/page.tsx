'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  BookOpen,
  Trash2,
  RefreshCcw,
  ImageIcon,
  Eye,
  Clock,
  TrendingUp,
  Loader2,
  Link2,
  Monitor,
  Smartphone,
  Pencil,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { logAuditAction } from '@/lib/auditService';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  author: string;
  is_published: boolean;
  category: string;
  tags: string[];
  views: number;
  status: 'Draft' | 'Review' | 'Published' | 'Archived';
  scheduled_at?: string;
  reading_time: number;
  created_at: string;
}

const initialForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  image_url: '',
  author: 'Admin',
  is_published: false,
  category: 'Guides',
  tags: [] as string[],
  status: 'Draft' as 'Draft' | 'Review' | 'Published' | 'Archived',
  scheduled_at: '',
};

export default function AdminBlogPage() {
  const { email: adminEmail } = useAdmin();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(initialForm);
  const [previewMode, setPreviewMode] = useState<'edit' | 'split' | 'live'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const fetchPosts = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const intelligence = useMemo(() => {
      const words = form.content.trim().split(/\s+/).filter(w => w).length;
      const characters = form.content.length;
      const readTime = Math.ceil(words / 200) || 1;

      let seoScore = 0;
      if (form.title.length > 30 && form.title.length < 60) seoScore += 30;
      if (form.excerpt.length > 50) seoScore += 30;
      if (form.content.includes('#')) seoScore += 20;
      if (form.image_url) seoScore += 20;

      return { words, characters, readTime, seoScore };
  }, [form]);

  const libraryStats = useMemo(() => {
      const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
      const topPost = [...posts].sort((a,b) => (b.views || 0) - (a.views || 0))[0];
      return { totalViews, topPost };
  }, [posts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'title' && !editingId) {
        setForm(prev => ({ ...prev, slug: value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') }));
    }
  };

  const insertTag = (tag: string) => {
      setForm(prev => ({ ...prev, content: prev.content + tag }));
  };

  const applyTemplate = (type: string) => {
      const templates: Record<string, string> = {
          faq: "# Frequently Asked Questions\n\n### Q: [Your Question Here]?\nA: [Your Answer Here]\n\n### Q: How do I track my order?\nA: You can track your order via the Track Package hub.",
          update: "# Product Update: [Product Name]\n\nWe are excited to announce a major restock of [Product]. \n\n## Key Improvements\n- Better battery life\n- New color variants\n- Improved packaging",
          guide: "# Ultimate Troubleshooting Guide\n\nFollow these steps to get your tech back in action.\n\n1. Check the power source\n2. Hold the reset button\n3. Contact Apex Support"
      };
      setForm(prev => ({ ...prev, content: templates[type] || prev.content }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !form.title || !form.content) return;

    setIsSubmitting(true);

    try {
      const postData = {
          ...form,
          reading_time: intelligence.readTime,
          updated_at: new Date().toISOString()
      };

      if (editingId) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingId);

        if (error) throw error;
        await logAuditAction(adminEmail, 'UPDATE_BLOG', { id: editingId, title: form.title });
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert([postData])
          .select('id')
          .single();

        if (error) throw error;
        await logAuditAction(adminEmail, 'CREATE_BLOG', { id: data?.id, title: form.title });
      }

      setForm(initialForm);
      setEditingId(null);
      fetchPosts();
    } catch (err) {
      console.error("Save Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const startEdit = (post: BlogPost) => {
      setEditingId(post.id);
      setForm({
          title: post.title || '',
          slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
          image_url: post.image_url || '',
          author: post.author || 'Admin',
          is_published: post.is_published || false,
          category: post.category || 'Guides',
          tags: post.tags || [],
          status: post.status || 'Draft',
          scheduled_at: post.scheduled_at || ''
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePost = async (id: number) => {
      if (!supabase || !confirm("Delete this guide permanently?")) return;
      try {
          const { error } = await supabase.from('blog_posts').delete().eq('id', id);
          if (error) throw error;
          await logAuditAction(adminEmail, 'DELETE_BLOG', { id });
          fetchPosts();
      } catch (err) {
          console.error(err);
      }
  };

  return (
    <div className="p-8 space-y-10 bg-slate-50 min-h-screen text-left">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Library Center</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Manage technical guides, news, and system documentation.</p>
        </div>
        <Button onClick={fetchPosts} variant="outline" className="rounded-xl h-12 px-6 border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all hover:shadow-lg">
            <RefreshCcw className="h-4 w-4 mr-2" /> Sync Data
        </Button>
      </header>

      {/* Analytics HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
              { label: 'Total Views', val: libraryStats.totalViews.toLocaleString(), icon: Eye, color: 'primary' },
              { label: 'Avg. Read Time', val: `${intelligence.readTime}m`, icon: Clock, color: 'primary' },
              { label: 'Top Article', val: libraryStats.topPost?.title || 'No Records', icon: TrendingUp, color: 'primary' },
          ].map((item) => (
              <Card key={item.label} className="p-8 rounded-[2.5rem] border-2 border-primary/5 bg-white shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all overflow-hidden">
                  <div className={`h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110 shadow-sm`}>
                      <item.icon className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{item.label}</p>
                      <h3 className="text-xl font-black text-slate-900 mt-1 tracking-tighter uppercase truncate">{item.val}</h3>
                  </div>
              </Card>
          ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-10">

          {/* Editor Area */}
          <div className={cn(
              "space-y-6 transition-all duration-500",
              previewMode === 'live' ? 'lg:col-span-0 hidden' : previewMode === 'split' ? 'lg:col-span-7' : 'lg:col-span-12'
          )}>
              <Card className="rounded-[3rem] border border-slate-100 shadow-2xl p-10 bg-white min-h-[800px] flex flex-col relative overflow-hidden">
                  <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Pencil className="h-5 w-5" /></div>
                          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{editingId ? 'Refine Content' : 'New Manuscript'}</h2>
                      </div>
                      <div className="flex items-center p-1 bg-slate-50 rounded-xl border border-slate-100">
                          <button onClick={() => setPreviewMode('edit')} className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", previewMode === 'edit' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>Edit</button>
                          <button onClick={() => setPreviewMode('split')} className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", previewMode === 'split' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>Split</button>
                          <button onClick={() => setPreviewMode('live')} className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", previewMode === 'live' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400")}>Preview</button>
                      </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8 flex-1">
                      <div className="grid lg:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Title</label>
                              <Input name="title" value={form.title} onChange={handleInputChange} placeholder="Article Title" className="rounded-2xl h-14 bg-slate-50 border-slate-100 font-bold text-lg" required />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">URL Slug</label>
                              <div className="relative">
                                  <Input name="slug" value={form.slug} onChange={handleInputChange} className="rounded-2xl h-14 bg-slate-50 border-slate-100 text-xs text-slate-400 pl-10" required />
                                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                              </div>
                          </div>
                      </div>

                      <div className="grid lg:grid-cols-3 gap-6">
                          <div className="space-y-2 lg:col-span-2">
                              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cover Image URL</label>
                              <div className="relative">
                                  <Input name="image_url" value={form.image_url} onChange={handleInputChange} placeholder="https://..." className="rounded-2xl h-14 bg-slate-50 border-slate-100 pl-10 text-sm font-medium" />
                                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Category</label>
                              <select name="category" value={form.category} onChange={handleInputChange} className="w-full h-14 px-4 rounded-2xl border border-slate-100 bg-slate-50 text-[10px] font-black uppercase outline-none transition-all">
                                  <option value="Guides">Guides</option>
                                  <option value="Tutorials">Tutorials</option>
                                  <option value="News">News</option>
                                  <option value="FAQ">FAQ</option>
                                  <option value="Policy">Policy</option>
                              </select>
                          </div>
                      </div>

                      {/* TOOLBAR (Clean Light style) */}
                      <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                              <button type="button" onClick={() => insertTag('**text**')} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Bold"><Bold className="h-4 w-4" /></button>
                              <button type="button" onClick={() => insertTag('*text*')} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Italic"><Italic className="h-4 w-4" /></button>
                              <div className="w-px h-4 bg-slate-200 mx-2"></div>
                              <button type="button" onClick={() => insertTag('# ')} className="p-2 text-slate-400 hover:text-primary transition-colors" title="H1"><Heading1 className="h-4 w-4" /></button>
                              <button type="button" onClick={() => insertTag('## ')} className="p-2 text-slate-400 hover:text-primary transition-colors" title="H2"><Heading2 className="h-4 w-4" /></button>
                              <div className="w-px h-4 bg-slate-200 mx-2"></div>
                              <button type="button" onClick={() => insertTag('\n- ')} className="p-2 text-slate-400 hover:text-primary transition-colors" title="List"><List className="h-4 w-4" /></button>

                              <div className="ml-auto flex gap-2">
                                  <button type="button" onClick={() => applyTemplate('faq')} className="px-3 py-1 rounded-lg bg-white text-slate-600 text-[8px] font-black uppercase hover:bg-slate-100 transition-all border border-slate-100 shadow-sm">FAQ</button>
                                  <button type="button" onClick={() => applyTemplate('guide')} className="px-3 py-1 rounded-lg bg-white text-slate-600 text-[8px] font-black uppercase hover:bg-slate-100 transition-all border border-slate-100 shadow-sm">Guide</button>
                              </div>
                          </div>

                          <div className="relative">
                              <Textarea
                                name="content"
                                value={form.content}
                                onChange={handleInputChange}
                                placeholder="Article body..."
                                className="min-h-[500px] rounded-[2.5rem] bg-slate-50 border-slate-100 resize-none p-10 font-mono text-sm leading-relaxed focus:ring-4 focus:ring-primary/5 transition-all"
                                required
                              />
                              <div className="absolute bottom-6 right-8 flex items-center gap-6 text-[9px] font-black uppercase text-slate-300">
                                  <span>Words: {intelligence.words}</span>
                                  <span>SEO: {intelligence.seoScore}%</span>
                              </div>
                          </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                          <div className="flex items-center gap-3 flex-1">
                              <input
                                type="checkbox"
                                id="is_published"
                                checked={form.is_published}
                                onChange={e => setForm(prev => ({ ...prev, is_published: e.target.checked, status: e.target.checked ? 'Published' : 'Draft' }))}
                                className="h-6 w-6 rounded-lg border-slate-300 text-primary focus:ring-primary cursor-pointer shadow-sm"
                              />
                              <label htmlFor="is_published" className="text-xs font-black uppercase tracking-widest text-slate-900 cursor-pointer">Live Distribution</label>
                          </div>
                          <div className="flex gap-3">
                            <Button type="submit" disabled={isSubmitting} className="h-16 px-10 rounded-[1.5rem] bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {editingId ? 'Save Edits' : 'Publish Entry'}
                            </Button>
                            {editingId && (
                                <Button type="button" onClick={cancelEditing} variant="outline" className="h-16 px-8 rounded-[1.5rem] border-slate-200 bg-white font-black uppercase text-[10px] tracking-widest transition-all hover:bg-rose-50 hover:text-rose-500 active:scale-95">Abort</Button>
                            )}
                          </div>
                      </div>
                  </form>
              </Card>
          </div>

          {/* Preview Area */}
          <div className={cn(
              "transition-all duration-500",
              previewMode === 'edit' ? 'lg:col-span-0 hidden' : previewMode === 'split' ? 'lg:col-span-5' : 'lg:col-span-12'
          )}>
              <div className="sticky top-8 space-y-6">
                  <div className="flex items-center justify-between px-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rendering Hub</h3>
                      <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                          <button onClick={() => setPreviewDevice('desktop')} className={cn("p-1.5 rounded-md transition-all", previewDevice === 'desktop' ? "bg-white text-primary shadow-sm" : "text-slate-400")}><Monitor className="h-3 w-3" /></button>
                          <button onClick={() => setPreviewDevice('mobile')} className={cn("p-1.5 rounded-md transition-all", previewDevice === 'mobile' ? "bg-white text-primary shadow-sm" : "text-slate-400")}><Smartphone className="h-3 w-3" /></button>
                      </div>
                  </div>

                  <div className={cn(
                      "bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-y-auto no-scrollbar mx-auto transition-all duration-500 relative",
                      previewDevice === 'desktop' ? 'w-full h-[700px]' : 'w-[320px] h-[640px] rounded-[3.5rem] border-[12px] border-slate-200'
                  )}>
                      <div className="p-10 space-y-8 text-left">
                          <header className="space-y-4">
                              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-full">{form.category || 'Guides'}</span>
                              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{form.title || 'Manuscript Title'}</h1>
                          </header>
                          <div className="prose prose-slate prose-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                              {form.content || 'Real-time manuscript rendering...'}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Article Log */}
      <section className="space-y-6">
          <div className="flex items-center justify-between px-2 text-left">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Archives</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{posts.length} Guides Logged</span>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
              {loading ? (
                  <div className="p-32 text-center flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Retrieving Manuscripts...</p>
                  </div>
              ) : posts.length === 0 ? (
                  <div className="p-32 text-center flex flex-col items-center gap-6">
                      <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-100 shadow-inner group">
                          <BookOpen className="h-10 w-10 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="max-w-md space-y-2">
                          <p className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Your Library is Silent</p>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed italic">&quot;Authorize your first tech guide to begin building the knowledge pool.&quot;</p>
                      </div>
                  </div>
              ) : (
                  <div className="divide-y divide-slate-50">
                      {posts.map(post => (
                          <div key={post.id} className="p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 hover:bg-slate-50/50 transition-all group">
                              <div className="flex items-center gap-8 flex-1 text-left">
                                  <div className="h-24 w-40 rounded-3xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center shadow-lg transition-all">
                                      {post.image_url ? (
                                          /* eslint-disable-next-line @next/next/no-img-element */
                                          <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                      ) : (
                                          <ImageIcon className="h-8 w-8 text-slate-300" />
                                      )}
                                  </div>
                                  <div className="min-w-0">
                                      <div className="flex items-center gap-3 mb-2">
                                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-400 text-[8px] font-black uppercase tracking-widest">{post.category}</span>
                                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1"><Eye className="h-2 w-2" /> {post.views || 0}</span>
                                      </div>
                                      <h3 className="font-black text-slate-900 uppercase text-lg tracking-tight group-hover:text-primary transition-colors leading-none">{post.title}</h3>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">By {post.author} • {new Date(post.created_at).toLocaleDateString()}</p>
                                  </div>
                              </div>

                              <div className="flex gap-2">
                                  <Button onClick={() => startEdit(post)} variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-300 hover:text-primary hover:border-primary/30 transition-all"><Pencil className="h-5 w-5" /></Button>
                                  <Button onClick={() => deletePost(post.id)} variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-200 transition-all"><Trash2 className="h-5 w-5" /></Button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </section>
    </div>
  );
}
