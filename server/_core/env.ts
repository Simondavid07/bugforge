export const ENV = {
  databaseUrl:
    process.env.SUPABASE_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  supabaseUrl:
    process.env.SUPABASE_URL ?? "https://zznvjtdspjampmztrunx.supabase.co",
  supabasePublishableKey:
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    "sb_publishable_8Gj1KX5UM7S1A2VbyAdFwg_UYYJhYbg",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "bugforge-private",
};
