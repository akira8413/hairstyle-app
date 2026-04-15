-- Supabaseに適用するSQL（SQL Editor で実行）

-- ユーザープロフィール & クレジット管理
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  credits integer not null default 3,
  total_generations integer not null default 0,
  stripe_customer_id text,
  is_premium boolean not null default false,
  premium_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS（Row Level Security）有効化
alter table public.profiles enable row level security;

-- ユーザーは自分のプロフィールのみ読み書き可能
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 新規ユーザー登録時に自動でプロフィール作成
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- トリガー設定
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- クレジット使用履歴
create table if not exists public.credit_history (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.credit_history enable row level security;

create policy "Users can view own credit history"
  on public.credit_history for select
  using (auth.uid() = user_id);

-- 購入履歴
create table if not exists public.purchases (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_session_id text,
  stripe_payment_intent_id text,
  plan text not null,
  amount integer not null,
  credits_added integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

create policy "Users can view own purchases"
  on public.purchases for select
  using (auth.uid() = user_id);
