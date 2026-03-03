-- Replace budget_min/max_php with source_price_usd on product_requests
alter table product_requests
  add column source_price_usd numeric(10,2);

alter table product_requests
  drop column budget_min_php,
  drop column budget_max_php;
