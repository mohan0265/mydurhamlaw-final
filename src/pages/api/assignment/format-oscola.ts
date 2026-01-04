import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, assignmentId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }

  try {
    // Simple OSCOLA formatter (in production, this would be more sophisticated)
    const formatted = await formatToOSCOLA(text);
    const citations = extractCitations(formatted);

    res.status(200).json({
      success: true,
      formattedText: formatted,
      citations,
    });

  } catch (error: any) {
    console.error('Format error:', error);
    res.status(500).json({ error: error.message || 'Failed to format' });
  }
}

function formatToOSCOLA(text: string): string {
  let formatted = text;

  // Example transformations (simplified - real OSCOLA is complex)
  
  // Convert case citations to proper format
  // e.g., "Smith v Jones 2020" -> "Smith v Jones [2020]"
  formatted = formatted.replace(/(\w+\s+v\s+\w+)\s+(\d{4})/g, '$1 [$2]');

  // Ensure proper spacing around citations
  formatted = formatted.replace(/\s+\[/g, ' [');
  formatted = formatted.replace(/\]\s+/g, '] ');

  // Convert numbered footnotes to superscript markers
  formatted = formatted.replace(/\[(\d+)\]/g, '<sup>$1</sup>');

  return formatted;
}

function extractCitations(text: string): any[] {
  const citations: any[] = [];
  const citationRegex = /\[(\d+)\]\s*([^\n]+)/g;
  
  let match;
  while ((match = citationRegex.exec(text)) !== null) {
    citations.push({
      number: match[1],
      text: match[2].trim(),
    });
  }

  return citations;
}
