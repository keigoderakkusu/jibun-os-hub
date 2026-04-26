import { useState } from 'react';
import {
  BookOpen, TrendingUp, Zap, Clock, ArrowRight,
  PenLine, Star, ExternalLink, Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { PageHeader } from './components/layout/PageHeader';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  readTime: number;
  date: string;
  featured?: boolean;
  affiliateTag?: string;
}

const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'AIエージェント「Hermes」をMacBook一台でオフライン動作させる方法',
    excerpt: 'NousResearch の Hermes Agent を Ollama + Colima（Docker）と組み合わせ、ネットワーク不要で動作するローカルAIエージェント環境を構築する手順を解説します。',
    category: 'AI・自動化',
    tags: ['Hermes', 'Ollama', 'Docker', 'macOS'],
    readTime: 8,
    date: '2026-04-26',
    featured: true,
  },
  {
    id: '2',
    title: 'n8n × Gemini APIでブログ記事を全自動生成・投稿する仕組みを作った',
    excerpt: 'Google NewsのRSSフィードからトレンドを取得し、Gemini 1.5 Flashで記事を生成、WordPressに自動投稿するn8nワークフローの作り方を公開します。',
    category: '副業・収益化',
    tags: ['n8n', 'Gemini', 'WordPress', 'ブログ自動化'],
    readTime: 12,
    date: '2026-04-20',
    featured: true,
    affiliateTag: 'n8n Cloud',
  },
  {
    id: '3',
    title: '【月額0円】OSS6本を組み合わせた個人AI自動化システム「自分株式会社OS」全体図',
    excerpt: 'Flowise・n8n・AnythingLLM・PocketBase・Dify・Appsmithを組み合わせ、月額ランニングコストほぼゼロで動く個人用AIシステムの全体アーキテクチャを公開します。',
    category: 'AI・自動化',
    tags: ['OSS', 'Flowise', 'n8n', 'AnythingLLM', 'PocketBase'],
    readTime: 15,
    date: '2026-04-15',
  },
  {
    id: '4',
    title: 'Apple Silicon（M1/M2）でローカルLLMを動かすベストプラクティス2026',
    excerpt: 'Ollama・LM Studio・llama.cppを比較し、qwen2.5-coder・llama3.2・gemma3などのモデルをApple Siliconで最速・省電力で動かすための設定を解説します。',
    category: 'AI・自動化',
    tags: ['Apple Silicon', 'Ollama', 'LLM', 'ローカルAI'],
    readTime: 10,
    date: '2026-04-10',
  },
  {
    id: '5',
    title: '副業ブログで月3万円を目指す：AIとアフィリエイトの組み合わせ戦略',
    excerpt: 'ブログ記事の自動生成・SEO最適化・アフィリエイトリンク管理をAIで効率化し、実際に収益を得るまでのロードマップを公開します。',
    category: '副業・収益化',
    tags: ['アフィリエイト', '副業', 'ブログ収益化', 'SEO'],
    readTime: 7,
    date: '2026-04-05',
    affiliateTag: 'もしもアフィリエイト',
  },
];

const CATEGORIES = ['すべて', 'AI・自動化', '副業・収益化'];

const CATEGORY_COLORS: Record<string, string> = {
  'AI・自動化': 'bg-violet-500/15 text-violet-400',
  '副業・収益化': 'bg-emerald-500/15 text-emerald-400',
};

function ArticleCard({ article, featured }: { article: Article; featured?: boolean }) {
  return (
    <Card className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${featured ? 'border-violet-500/30' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.category] ?? 'bg-gray-500/15 text-gray-400'}`}>
            {article.category}
          </span>
          {article.affiliateTag && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
              💰 {article.affiliateTag}
            </span>
          )}
        </div>
        <CardTitle className="text-base leading-snug group-hover:text-violet-400 transition-colors line-clamp-2">
          {article.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm leading-relaxed line-clamp-2 mb-3">
          {article.excerpt}
        </CardDescription>
        <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {article.readTime}分
            </span>
            <span>{article.date}</span>
          </div>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-violet-400 opacity-0 group-hover:opacity-100" />
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {article.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
              #{tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Blog() {
  const [category, setCategory] = useState('すべて');
  const [search, setSearch] = useState('');

  const filtered = ARTICLES.filter(a =>
    (category === 'すべて' || a.category === category) &&
    (search === '' || a.title.includes(search) || a.tags.some(t => t.includes(search)))
  );

  const featured = filtered.filter(a => a.featured);
  const rest = filtered.filter(a => !a.featured);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <PageHeader
        title="ブログ"
        description="AI×自動化で副業・収益化を加速するナレッジを発信"
        icon={<BookOpen size={16} />}
      />

      <div className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">

        {/* KPI バー */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '記事数', value: `${ARTICLES.length}`, icon: PenLine, color: 'text-violet-400' },
            { label: '月間PV目標', value: '10,000', icon: TrendingUp, color: 'text-emerald-400' },
            { label: '収益目標', value: '¥30,000', icon: Star, color: 'text-amber-400' },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{kpi.label}</p>
                    <p className="text-xl font-bold mt-0.5">{kpi.value}</p>
                  </div>
                  <kpi.icon size={20} className={kpi.color} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 検索・カテゴリフィルター */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <Input
              placeholder="記事を検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-1.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: category === cat ? 'hsl(var(--sidebar-accent))' : 'hsl(var(--muted))',
                  color: category === cat ? 'hsl(var(--sidebar-accent-foreground))' : 'hsl(var(--muted-foreground))',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 注目記事 */}
        {featured.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <Zap size={13} className="text-violet-400" /> 注目記事
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featured.map(a => <ArticleCard key={a.id} article={a} featured />)}
            </div>
          </section>
        )}

        {/* 全記事 */}
        {rest.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <BookOpen size={13} /> すべての記事
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
          </section>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">記事が見つかりません</p>
          </div>
        )}

        {/* Hermes で記事生成CTA */}
        <Card className="border-dashed border-violet-500/40 bg-violet-500/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                <Zap size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">Hermes Agent で記事を自動生成</p>
                <p className="text-xs mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  ターミナルで <code className="px-1 py-0.5 rounded text-violet-400" style={{ background: 'hsl(var(--muted))' }}>hermes</code> を起動し、
                  「〇〇についてブログ記事を書いて」と話しかけるだけで記事の下書きを生成できます。
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                    <ExternalLink size={11} /> 使い方を見る
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
