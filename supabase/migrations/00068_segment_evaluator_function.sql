-- ============================================================
-- 00068: Segment evaluator function
-- Provides a secure way to run parameterized segment queries
-- from the application layer via Supabase RPC.
-- ============================================================

-- This function executes a parameterized SQL query built by the
-- segment engine. It's restricted to the service_role to prevent
-- misuse — only the admin client can call it.

CREATE OR REPLACE FUNCTION evaluate_segment_query(
  query_sql text,
  query_params text DEFAULT '[]'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb;
  params_arr jsonb;
  param_count int;
BEGIN
  -- Parse the JSON params array
  params_arr := query_params::jsonb;
  param_count := jsonb_array_length(params_arr);

  -- Safety: only allow SELECT queries
  IF NOT (
    trim(leading from lower(query_sql)) LIKE 'select%'
  ) THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Safety: block dangerous keywords
  IF lower(query_sql) ~ '(insert|update|delete|drop|alter|create|truncate|grant|revoke)' THEN
    RAISE EXCEPTION 'Query contains disallowed keywords';
  END IF;

  -- Execute with parameters based on count
  -- We use EXECUTE ... INTO for parameterized queries
  CASE param_count
    WHEN 0 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_sql || ') t'
      INTO result;
    WHEN 1 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_sql || ') t'
      INTO result
      USING (params_arr->>0);
    WHEN 2 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_sql || ') t'
      INTO result
      USING (params_arr->>0), (params_arr->>1);
    WHEN 3 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_sql || ') t'
      INTO result
      USING (params_arr->>0), (params_arr->>1), (params_arr->>2);
    WHEN 4 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_sql || ') t'
      INTO result
      USING (params_arr->>0), (params_arr->>1), (params_arr->>2), (params_arr->>3);
    WHEN 5 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_sql || ') t'
      INTO result
      USING (params_arr->>0), (params_arr->>1), (params_arr->>2), (params_arr->>3), (params_arr->>4);
    WHEN 6 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_sql || ') t'
      INTO result
      USING (params_arr->>0), (params_arr->>1), (params_arr->>2), (params_arr->>3), (params_arr->>4), (params_arr->>5);
    WHEN 7 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_sql || ') t'
      INTO result
      USING (params_arr->>0), (params_arr->>1), (params_arr->>2), (params_arr->>3), (params_arr->>4), (params_arr->>5), (params_arr->>6);
    WHEN 8 THEN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_sql || ') t'
      INTO result
      USING (params_arr->>0), (params_arr->>1), (params_arr->>2), (params_arr->>3), (params_arr->>4), (params_arr->>5), (params_arr->>6), (params_arr->>7);
    ELSE
      RAISE EXCEPTION 'Too many parameters (max 8)';
  END CASE;

  -- Return empty array instead of null
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Only service_role can execute this function
REVOKE ALL ON FUNCTION evaluate_segment_query(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION evaluate_segment_query(text, text) FROM anon;
REVOKE ALL ON FUNCTION evaluate_segment_query(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION evaluate_segment_query(text, text) TO service_role;

COMMENT ON FUNCTION evaluate_segment_query IS 'Executes parameterized segment queries built by the CRM segment engine. Restricted to service_role.';
