-- Create RPC to safely update restricted_city bypassing RLS via SECURITY DEFINER
create or replace function public.set_restricted_city(p_city_id uuid, p_rc jsonb)
returns void
language sql
security definer
as $$
  update public.cities
  set restricted_city = p_rc,
      updated_at = now()
  where id = p_city_id;
$$;

-- Allow authenticated users to call it
grant execute on function public.set_restricted_city(uuid, jsonb) to authenticated;
