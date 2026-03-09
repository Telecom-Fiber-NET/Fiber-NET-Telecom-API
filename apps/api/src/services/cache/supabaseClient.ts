import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL!;
const KEY = process.env.SUPABASE_KEY!;

if (!URL || !KEY) {
  console.warn("Supabase não configurado. cacheGet/cacheSet irão falhar se usados.");
}

export const supabase = createClient(URL, KEY);

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!URL || !KEY) return null;
  try {
    const { data, error } = await supabase.from("cache").select("value,expires_at").eq("key", key).single();
    if (error) return null;
    if (!data) return null;
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // expired
      await supabase.from("cache").delete().eq("key", key);
      return null;
    }
    return JSON.parse(data.value) as T;
  } catch (err) {
    console.warn("Supabase cacheGet failed:", err);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds = 60) {
  if (!URL || !KEY) return;
  const stringValue = JSON.stringify(value);
  const expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  await supabase.from("cache").upsert({ key, value: stringValue, expires_at });
}