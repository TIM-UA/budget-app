create table if not exists public.app_user_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.app_user_data enable row level security;

grant select, insert, update, delete on public.app_user_data to authenticated;

drop policy if exists "Users can read their own app data" on public.app_user_data;
create policy "Users can read their own app data"
  on public.app_user_data for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own app data" on public.app_user_data;
create policy "Users can insert their own app data"
  on public.app_user_data for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own app data" on public.app_user_data;
create policy "Users can update their own app data"
  on public.app_user_data for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own app data" on public.app_user_data;
create policy "Users can delete their own app data"
  on public.app_user_data for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.set_app_user_data_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_user_data_updated_at on public.app_user_data;
create trigger app_user_data_updated_at
  before update on public.app_user_data
  for each row execute procedure public.set_app_user_data_updated_at();
