-- Create RPC for role distribution to avoid manual reduction in API routes
CREATE OR REPLACE FUNCTION get_tenant_role_distribution(p_tenant_id UUID)
RETURNS TABLE (role TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT tm.role::TEXT, count(*)
    FROM tenant_members tm
    WHERE tm.tenant_id = p_tenant_id
    GROUP BY tm.role;
END;
$$;
