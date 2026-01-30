-- Force schema cache reload to detect relationships
-- This is critical after adding module_catalog columns
NOTIFY pgrst, 'reload schema';

