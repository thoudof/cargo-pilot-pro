
CREATE OR REPLACE FUNCTION get_expenses_for_trips(trip_ids UUID[])
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(trip_id, total)
  INTO result
  FROM (
    SELECT trip_id, SUM(amount) AS total
    FROM public.trip_expenses
    WHERE trip_id = ANY(trip_ids)
    GROUP BY trip_id
  ) AS expenses;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
