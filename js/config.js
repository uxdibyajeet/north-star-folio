// config.js
const SUPABASE_URL = "https://pbwvplrzcrumntxooafw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vlXAuwsxzx81yVSYR86WOA_VRf93ANr";

window.supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};

window.supabaseClient =
  window.supabase && SUPABASE_ANON_KEY
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

window.isSupabaseConfigured = Boolean(window.supabaseClient);

window.getSupabaseClient = function getSupabaseClient() {
  return window.supabaseClient;
};
