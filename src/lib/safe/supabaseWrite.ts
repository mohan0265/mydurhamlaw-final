import { getSupabaseClient } from "@/lib/supabase/client";

class TimeoutError extends Error {
  constructor(message = "Write timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string) {
  let t: any;
  const timeout = new Promise<T>((_, reject) => {
    t = setTimeout(
      () => reject(new TimeoutError(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
}

export async function safeInsert(
  table: string,
  values: any,
  opts?: { timeoutMs?: number; tag?: string },
) {
  const supabase = getSupabaseClient();
  const timeoutMs = opts?.timeoutMs ?? 3500;
  const tag = opts?.tag ?? "SAFE_INSERT";

  try {
    const op = supabase.from(table).insert(values).select().maybeSingle();
    const { data, error } = await withTimeout(op, timeoutMs, `${tag}:${table}`);

    if (error) {
      const msg = error.message || "Insert failed";
      // 403 from PostgREST usually becomes a Supabase error; treat as non-fatal.
      console.warn(`[${tag}] non-fatal insert error`, { table, msg });
      return { ok: false as const, data: null, error };
    }

    return { ok: true as const, data, error: null };
  } catch (e: any) {
    console.warn(`[${tag}] non-fatal insert exception`, {
      table,
      msg: e?.message || String(e),
    });
    return { ok: false as const, data: null, error: e };
  }
}

export async function safeUpsert(
  table: string,
  values: any,
  opts?: { timeoutMs?: number; tag?: string; onConflict?: string },
) {
  const supabase = getSupabaseClient();
  const timeoutMs = opts?.timeoutMs ?? 3500;
  const tag = opts?.tag ?? "SAFE_UPSERT";
  const onConflict = opts?.onConflict ?? "id";

  try {
    const op = supabase
      .from(table)
      .upsert(values, { onConflict })
      .select()
      .maybeSingle();
    const { data, error } = await withTimeout(op, timeoutMs, `${tag}:${table}`);

    if (error) {
      const msg = error.message || "Upsert failed";
      console.warn(`[${tag}] non-fatal upsert error`, { table, msg });
      return { ok: false as const, data: null, error };
    }

    return { ok: true as const, data, error: null };
  } catch (e: any) {
    console.warn(`[${tag}] non-fatal upsert exception`, {
      table,
      msg: e?.message || String(e),
    });
    return { ok: false as const, data: null, error: e };
  }
}
