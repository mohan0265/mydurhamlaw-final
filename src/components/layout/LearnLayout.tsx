import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/supabase/AuthContext';

interface LearnLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  slug: string;
  relatedArticles?: { title: string; slug: string }[];
}

export const LearnLayout: React.FC<LearnLayoutProps> = ({
  children,
  title,
  description,
  slug,
  relatedArticles = []
}) => {
  const { user } = useAuth();
  const canonicalUrl = `https://mydurhamlaw.com/learn/${slug}`;

  return (
    <div className="bg-white flex flex-col">
      <Head>
        <title>{title} - MyDurhamLaw Learn</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="MyDurhamLaw" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Head>

      <main className="flex-1">
        {/* Article Content */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <Link 
            href="/learn" 
            className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium mb-8 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learn Hub
          </Link>
          
          {children}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-16 pt-10 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Related Reading</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedArticles.map((article) => (
                  <Link 
                    key={article.slug} 
                    href={`/learn/${article.slug}`}
                    className="p-6 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group"
                  >
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 mb-2">
                      {article.title}
                    </h4>
                    <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                      Read article <ArrowRight className="w-4 h-4" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Final CTA Block */}
          <div className="mt-20 p-8 md:p-12 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl text-center text-white shadow-xl shadow-blue-200">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Master Your Law Degree with MyDurhamLaw
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join the growing community of Durham students using AI to study smarter, stay organized, and keep connected.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg w-full sm:w-auto">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg w-full sm:w-auto">
                      View Plans
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/eligibility?next=/signup&plan=free">
                    <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg w-full sm:w-auto">
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/login?next=/pricing">
                    <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg w-full sm:w-auto">
                      Member Login
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};
