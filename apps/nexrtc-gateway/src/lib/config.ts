import { supabase } from './supabaseClient';

const cache: Record<string, string | null> = {};

export async function getConfigValue(key: string): Promise<string | null> {
  if (cache[key] !== undefined) {
    return cache[key];
  }
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', key)
    .single();
  if (error) {
    console.error('Failed to fetch config', key, error.message);
    cache[key] = null;
    return null;
  }
  const value = data?.value ?? null;
  cache[key] = value;
  return value;
}
 
export async function setConfigValue(key: string, value: string): Promise<void> {
  const { error } = await supabase.from('app_config').upsert({ key, value });
  if (error) {
    throw new Error(`Failed to set config ${key}: ${error.message}`);
  }
  cache[key] = value;
}
 