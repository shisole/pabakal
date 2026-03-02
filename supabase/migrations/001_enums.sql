-- Pabakal enum types
create type user_role as enum ('admin', 'customer');
create type cargo_status as enum ('purchased', 'packed', 'shipped', 'in_transit', 'arrived', 'distributed');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'shipped_local', 'delivered', 'cancelled');
create type fulfillment_type as enum ('in_stock', 'pre_order');
create type payment_method as enum ('gcash', 'bank_transfer', 'cash', 'dragonpay');
create type payment_status as enum ('pending', 'partial', 'paid', 'refunded');
create type product_status as enum ('draft', 'active', 'sold_out', 'archived');
create type product_condition as enum ('new', 'like_new', 'good', 'fair');
