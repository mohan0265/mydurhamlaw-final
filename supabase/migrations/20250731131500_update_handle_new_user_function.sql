-- Update handle_new_user function to prevent conflicts with manual profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create profile if one doesn't already exist
    -- This prevents conflicts with manual profile creation in LoginRedirectPage
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        INSERT INTO public.profiles (
            id,
            year_group,
            agreed_to_terms,
            display_name,
            avatar_url
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'year_group', 'year1'),
            COALESCE((NEW.raw_user_meta_data->>'agreed_to_terms')::boolean, TRUE),
            COALESCE(
                NEW.raw_user_meta_data->>'display_name',
                NEW.raw_user_meta_data->>'name',
                split_part(NEW.email, '@', 1)
            ),
            COALESCE(
                NEW.raw_user_meta_data->>'avatar_url',
                NEW.raw_user_meta_data->>'picture'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;