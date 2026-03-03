-- Fix notification triggers: reference_id is uuid, not text
create or replace function notify_admin_new_request()
returns trigger as $$
declare
  admin_row record;
begin
  for admin_row in
    select id from profiles where role = 'admin'
  loop
    insert into notifications (user_id, title, body, type, reference_id, reference_type)
    values (
      admin_row.id,
      'New Product Request',
      'A customer requested: ' || new.product_name,
      'product_request',
      new.id,
      'product_request'
    );
  end loop;
  return new;
end;
$$ language plpgsql security definer;

create or replace function notify_customer_request_response()
returns trigger as $$
begin
  if old.admin_response is null and new.admin_response is not null then
    insert into notifications (user_id, title, body, type, reference_id, reference_type)
    values (
      new.customer_id,
      'Request Update',
      'Your request for "' || new.product_name || '" has been updated.',
      'product_request',
      new.id,
      'product_request'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;
