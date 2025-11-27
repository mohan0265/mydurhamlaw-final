        .select('user_id, last_seen_at, last_topic, last_message')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.debug('[durmah] memory GET soft-fail:', error);
        return softOk(res, { ok: true, memory: null });
      }

      return softOk(res, { ok: true, memory: data ?? null });
    } catch (e) {
      console.debug('[durmah] memory GET exception:', e);
      return softOk(res, { ok: true, memory: null });
    }
  }

  if (req.method === 'POST') {
    try {
      const { last_topic, last_message } = (req.body || {}) as {
        last_topic?: string;
        last_message?: string;
      };

      const { error } = await supabase
        .from('durmah_memory')
        .upsert(
          [
            {
              user_id: user.id,
              last_topic: last_topic || null,
              last_message: last_message || null,
              last_seen_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'user_id' }
        );

      if (error) {
        console.debug('[durmah] memory POST soft-fail:', error);
        return softOk(res, { ok: true });
      }

      return softOk(res, { ok: true });
    } catch (e) {
      console.debug('[durmah] memory POST exception:', e);
      return softOk(res, { ok: true });
    }
  }

  return res.status(405).json({ ok: false, error: 'method not allowed' });
}
