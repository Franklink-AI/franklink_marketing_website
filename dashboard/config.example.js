// Copy this file to `dashboard/config.js` and fill in values.
// Keep `dashboard/config.js` out of git (it is ignored).
window.FRANKLINK_DASHBOARD_CONFIG = {
  // Your Supabase project URL (Settings → API)
  supabaseUrl: "https://YOUR_PROJECT_REF.supabase.co",
  // Your Supabase anon key (Settings → API)
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",

  // Optional: override table names if your schema differs.
  tables: {
    users: "users",
    groupChats: "group_chats",
    careerNotes: "career_notes",
  },

  // Optional: if you log in with a phone-number username, the dashboard will
  // transform it into an email for Supabase Auth (email/password).
  // Example phone: +13027242007 -> 13027242007@users.franklink.ai
  auth: {
    phoneUsernameEmailDomain: "users.franklink.ai",
  },
};

