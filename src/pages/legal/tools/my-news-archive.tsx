import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import { ArrowLeft, BookOpen, Calendar, Clock, Loader2, Newspaper, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { NewsAnalysisModal } from '@/components/news/NewsAnalysisModal';

interface AnalyzedNewsItem {
  id: string;
  article_title: string;
  article_url?: string;
  article_source?: string;
  original_text?: string;
  ai_analysis: any; // The JSON blob
  created_at: string;
}

export default function MyNewsArchivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<AnalyzedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<AnalyzedNewsItem | null>(null);

  useEffect(() => {
    if (user) {
      fetchArchive();
    }
  }, [user]);

  const fetchArchive = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('news_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching archive:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this analysis?')) return;

    try {
        const supabase = getSupabaseClient();
        if(!supabase) return;

        const { error } = await supabase
            .from('news_analyses')
            .delete()
            .eq('id', id);

        if(error) throw error;
        setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
        console.error('Failed to delete:', err);
        alert('Failed to delete item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <Button
                onClick={() => router.push('/legal/tools/legal-news-feed')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Live News
              </Button>
             <div>
                <h1 className="text-3xl font-bold text-gray-900">My News Archive</h1>
                <p className="text-gray-500">Your personal library of analyzed legal news and insights</p>
             </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-400" />
             </div>
             <h3 className="text-xl font-semibold text-gray-800">No archived news yet</h3>
             <p className="text-gray-500 max-w-md mx-auto mt-2">
               Go to the Live News feed, select an article, and click "Analyze & Deep Dive" to save your first detailed analysis here.
             </p>
             <Button 
               onClick={() => router.push('/legal/tools/legal-news-feed')}
               className="mt-6 bg-purple-600 text-white hover:bg-purple-700"
             >
               Browse Live News
             </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card 
                key={item.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group border-purple-100"
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="p-6">
                   <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Newspaper className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete from archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                   
                   <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 leading-tight">
                     {item.article_title}
                   </h3>
                   
                   <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}
                      </span>
                      {item.article_source && (
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                           {item.article_source}
                        </span>
                      )}
                   </div>

                   <div className="space-y-2">
                      <div className="text-sm text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {item.ai_analysis?.summary || "No summary available."}
                      </div>
                      
                      {/* Tags/Keywords from analysis */}
                      {item.ai_analysis?.legal_concepts && (
                        <div className="flex flex-wrap gap-1 mt-3">
                           {item.ai_analysis.legal_concepts.slice(0, 3).map((tag: string, i: number) => (
                             <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                               {tag}
                             </span>
                           ))}
                        </div>
                      )}
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedItem && (
          <NewsAnalysisModal
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            article={{
              title: selectedItem.article_title,
              url: selectedItem.article_url,
              source: selectedItem.article_source,
              summary: selectedItem.ai_analysis?.summary
            }}
            initialAnalysis={selectedItem.ai_analysis}
            originalText={selectedItem.original_text}
            readOnly={true}
          />
        )}

      </div>
    </div>
  );
}
