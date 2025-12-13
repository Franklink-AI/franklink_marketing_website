# Franklink Dashboard

This dashboard lives at `https://franklink.ai/dashboard/` (served from `dashboard/index.html`).

## Local run

- `python server.py` then open `http://localhost:8000/dashboard/`

## Supabase setup

1. Run `supabase/dashboard.sql` in the Supabase SQL editor.
2. Create `dashboard/config.js` (copy from `dashboard/config.example.js`) and set:
   - `supabaseUrl`
   - `supabaseAnonKey`

## Login model (phone-number username)

The UI accepts your phone number as the username, and converts it into an email for Supabase Auth:

- `+1 (302) 724-2007` → `13027242007@users.franklink.ai`

This means your Supabase Auth user should be created with the matching email + password.

If you prefer a different mapping, change `auth.phoneUsernameEmailDomain` in `dashboard/config.js`
and ensure the Auth emails match.

