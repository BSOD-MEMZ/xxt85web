-- Create a profile from trusted Auth metadata after a new user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    username,
    avatar_url,
    bio,
    birthday,
    love,
    hate,
    goal,
    role,
    created_at
  )
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data ->> 'avatar_url', ''), '1'),
    coalesce(new.raw_user_meta_data ->> 'bio', ''),
    nullif(new.raw_user_meta_data ->> 'birthday', '')::date,
    coalesce(new.raw_user_meta_data ->> 'love', ''),
    coalesce(new.raw_user_meta_data ->> 'hate', ''),
    coalesce(new.raw_user_meta_data ->> 'goal', ''),
    'user',
    coalesce(new.created_at, now())
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill Auth users created before the trigger existed.
insert into public.profiles (
  id,
  username,
  avatar_url,
  bio,
  birthday,
  love,
  hate,
  goal,
  role,
  created_at
)
select
  users.id,
  coalesce(nullif(users.raw_user_meta_data ->> 'username', ''), split_part(users.email, '@', 1)),
  coalesce(nullif(users.raw_user_meta_data ->> 'avatar_url', ''), '1'),
  coalesce(users.raw_user_meta_data ->> 'bio', ''),
  nullif(users.raw_user_meta_data ->> 'birthday', '')::date,
  coalesce(users.raw_user_meta_data ->> 'love', ''),
  coalesce(users.raw_user_meta_data ->> 'hate', ''),
  coalesce(users.raw_user_meta_data ->> 'goal', ''),
  'user',
  coalesce(users.created_at, now())
from auth.users as users
where not exists (
  select 1
  from public.profiles as profiles
  where profiles.id = users.id
);
