-- Function to automatically create a user profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    domain text;
BEGIN
    -- Extract domain from email (everything after @)
    domain := split_part(new.email, '@', 2);
    
    INSERT INTO public.users (id, email, institution_domain, display_name)
    VALUES (
        new.id,
        new.email,
        domain,
        split_part(new.email, '@', 1) -- default display name to the username part
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
