export default () => ({
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    bucket: process.env.SUPABASE_STORAGE_BUCKET!,
  },
});
