# Driver Time Log

Mobile-friendly multi-user driver time logging app using Supabase Authentication and PostgreSQL.

## Supabase updates required

Run `supabase-admin.sql` in the Supabase SQL Editor. It adds driver names, creates profiles for existing users, creates profiles automatically for new signups, and allows admins to read profiles and all time entries.

After running the SQL:

1. Open the app and create a new account with a full name.
2. In Supabase Authentication → Users, copy that user’s UUID.
3. In SQL Editor, run:

```sql
update public.profiles
set is_admin = true
where id = 'PASTE_ADMIN_USER_UUID_HERE';
```

4. Log out and back in as the admin. The Admin view will show a driver filter and driver names in entries.

The frontend uses only the Supabase project URL and anon/public key. Never put the database password or service-role key in the frontend.
