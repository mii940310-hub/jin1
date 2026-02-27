-- Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  role text check (role in ('consumer', 'farmer', 'admin')) default 'consumer',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Farms
create table if not exists farms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade,
  name text not null,
  description text,
  category text check (category in ('vegetable', 'grain')),
  price_farmer integer not null,
  price_logistics integer not null,
  price_fee integer not null,
  price_total integer not null,
  stock_quantity integer default 0,
  image_url text,
  harvest_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Carts
create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cart Items
create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references carts(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(cart_id, product_id)
);

-- Orders
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  total_amount integer not null,
  status text check (status in ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'completed', 'cancelled')) default 'pending',
  shipping_address text,
  payment_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Order Items
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer not null,
  unit_price integer not null,
  total_price integer not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table farms enable row level security;
alter table products enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- RLS Policies
-- Products: Read for everyone
create policy "Products are viewable by everyone" on products for select using (true);

-- Profiles: Own read/update
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Carts: Own only
create policy "Users can view own cart" on carts for select using (auth.uid() = user_id);
create policy "Users can manage own cart" on carts for all using (auth.uid() = user_id);

-- Cart Items: Own cart only
create policy "Users can view own cart items" on cart_items for select using (
  exists (select 1 from carts where carts.id = cart_items.cart_id and carts.user_id = auth.uid())
);
create policy "Users can manage own cart items" on cart_items for all using (
  exists (select 1 from carts where carts.id = cart_items.cart_id and carts.user_id = auth.uid())
);

-- Orders: Own only
create policy "Users can view own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can create own orders" on orders for insert with check (auth.uid() = user_id);

-- Order Items: Own orders only
create policy "Users can view own order items" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

-- SEED DATA (Need a farm first)
-- This requires an existing user ID, so we use dummy data for local development if needed, 
-- but SQL insert without valid UUID will fail if FK is enforced.
-- We can insert a mock farm without FK for testing if needed, or assume first user will be one.

-- Insert 5 Sample Products (using dummy IDs for farm_id, ideally replaced with real ones)
-- Since we don't have real UUIDs yet, these are placeholders for the user to run.
