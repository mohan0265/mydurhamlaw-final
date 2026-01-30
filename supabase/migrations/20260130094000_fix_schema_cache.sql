-- Force schema cache reload to detect relationships
NOTIFY pgrst, 'reload schema';

-- explicit foreign key check just in case
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_modules_module_catalog_id_fkey') THEN
        ALTER TABLE "public"."user_modules" 
        ADD CONSTRAINT "user_modules_module_catalog_id_fkey" 
        FOREIGN KEY ("module_catalog_id") 
        REFERENCES "public"."module_catalog" ("id");
    END IF;
END $$;
