// src/lib/news/fetchLatestLegalNews.ts

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  topicTags: string[];
  discussionPrompt?: string;
  content?: string;
  timestamp: string; // ✅ Add this to match component expectation
}

export async function fetchLatestLegalNews(): Promise<NewsItem[]> {
  try {
    const mockArticles: NewsItem[] = [
      {
        id: '1',
        title: 'UK Supreme Court Delivers Landmark Ruling on AI Evidence in Criminal Trials',
        summary: 'The Supreme Court has established new precedent regarding the admissibility of AI-generated evidence in criminal proceedings, raising significant questions about digital proof standards.',
        url: 'https://example.com/news/ai-evidence-ruling',
        source: 'Legal Times UK',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        topicTags: ['Criminal Law', 'Evidence Law', 'Legal Tech'],
        content: 'In a groundbreaking 5-2 decision, the UK Supreme Court has ruled that AI-generated evidence must meet enhanced reliability standards...',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        title: 'European Court of Human Rights Rules on UK Surveillance Powers Post-Brexit',
        summary: 'The ECHR has issued a significant judgment on the compatibility of UK mass surveillance legislation with human rights protections, following Brexit transition arrangements.',
        url: 'https://example.com/news/echr-surveillance-ruling',
        source: 'Human Rights Weekly',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        topicTags: ['Human Rights Law', 'Constitutional Law', 'European Union Law'],
        content: 'The European Court of Human Rights has found violations in the UK\'s Investigatory Powers Act 2016...',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: '3',
        title: 'Climate Change Litigation: High Court Grants Permission for Youth Climate Case',
        summary: 'The High Court has given permission for a landmark case brought by young climate activists against the UK government, challenging climate policy adequacy.',
        url: 'https://example.com/news/youth-climate-case',
        source: 'Environmental Law Review',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        topicTags: ['Administrative Law', 'Human Rights Law', 'Constitutional Law'],
        content: 'Justice Thornton has granted permission for judicial review in the case of Sharma v Secretary of State...',
        timestamp: new Date(Date.now() - 10800000).toISOString()
      },
      {
        id: '4',
        title: 'Legal Services Board Announces Revolutionary Changes to Solicitor Training',
        summary: 'Major reforms to the Solicitors Qualifying Examination (SQE) have been announced, incorporating mandatory AI literacy and climate law modules.',
        url: 'https://example.com/news/sqe-reforms',
        source: 'The Lawyer',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
        topicTags: ['Legal Education', 'Professional Conduct', 'Legal Tech'],
        content: 'The Legal Services Board has approved sweeping changes to legal education...',
        timestamp: new Date(Date.now() - 14400000).toISOString()
      },
      {
        id: '5',
        title: 'House of Lords Debates Proposed Reforms to Judicial Review Process',
        summary: 'Heated debates in the House of Lords over government proposals to restrict judicial review applications...',
        url: 'https://example.com/news/judicial-review-reforms',
        source: 'Parliamentary Review',
        publishedAt: new Date(Date.now() - 18000000).toISOString(),
        topicTags: ['Constitutional Law', 'Administrative Law', 'Access to Justice'],
        content: 'The Judicial Review and Courts Bill has faced fierce opposition in the House of Lords...',
        timestamp: new Date(Date.now() - 18000000).toISOString()
      },
      {
        id: '6',
        title: 'Supreme Court to Hear Major Case on Gender Recognition Rights',
        summary: 'The UK Supreme Court has agreed to hear an appeal concerning transgender rights and the interpretation of the Equality Act 2010.',
        url: 'https://example.com/news/gender-rights-case',
        source: 'Equality Law Reports',
        publishedAt: new Date(Date.now() - 21600000).toISOString(),
        topicTags: ['Human Rights Law', 'Equality Law', 'Constitutional Law'],
        content: 'The Supreme Court will hear the case of Forstater v CGD Europe...',
        timestamp: new Date(Date.now() - 21600000).toISOString()
      }
    ];

    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log('📰 Fetched', mockArticles.length, 'legal news articles');
    return mockArticles;
  } catch (error) {
    console.error('❌ Error fetching legal news:', error);

    return [
      {
        id: 'fallback-1',
        title: 'Legal News Service Temporarily Unavailable',
        summary: 'We are experiencing technical difficulties. Please check back later for the latest legal developments.',
        url: '#',
        source: 'MyDurhamLaw',
        publishedAt: new Date().toISOString(),
        topicTags: ['System Notice'],
        timestamp: new Date().toISOString() // ✅ Ensure fallback has timestamp too
      }
    ];
  }
}
