// src/pages/legal/tools/legal-news-settings.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/lib/supabase/AuthContext';
import { getSupabaseClient } from '@/lib/supabase/client';

interface NewsPreferences {
  enableHumanRights: boolean;
  enableLegalTech: boolean;
  enablePublicLaw: boolean;
  preferRecent: boolean;
}

export default function LegalNewsSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<NewsPreferences>({
    enableHumanRights: true,
    enableLegalTech: true,
    enablePublicLaw: true,
    preferRecent: true,
  });

  useEffect(() => {
    const loadPrefs = async () => {
      if (!user) return;
      
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }
      
      const { data, error } = await supabase
        .from('news_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (data && data.preferences) {
        setPrefs(data.preferences);
      } else if (error && error.code !== 'PGRST116') {
        console.error(error);
        alert('Error loading preferences.');
      }
    };
    loadPrefs();
  }, [user]);

  const updatePreferences = async () => {
    if (!user) return;
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      alert('Unable to connect to database.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('news_preferences')
      .upsert({
        user_id: user.id,
        preferences: prefs,
      });

    if (error) {
      alert('Failed to save preferences.');
    } else {
      alert('Preferences updated!');
    }
    setLoading(false);
  };

  const toggle = (key: keyof NewsPreferences) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Customize Your Legal News</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Human Rights</span>
            <Switch checked={prefs.enableHumanRights} onCheckedChange={() => toggle('enableHumanRights')} />
          </div>
          <div className="flex items-center justify-between">
            <span>Legal Tech</span>
            <Switch checked={prefs.enableLegalTech} onCheckedChange={() => toggle('enableLegalTech')} />
          </div>
          <div className="flex items-center justify-between">
            <span>Public Law</span>
            <Switch checked={prefs.enablePublicLaw} onCheckedChange={() => toggle('enablePublicLaw')} />
          </div>
          <div className="flex items-center justify-between">
            <span>Prefer Recent Articles</span>
            <Switch checked={prefs.preferRecent} onCheckedChange={() => toggle('preferRecent')} />
          </div>
          <Button onClick={updatePreferences} disabled={loading}>
            {loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
