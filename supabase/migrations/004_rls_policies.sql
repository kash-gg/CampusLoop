-- Listings visible only within same institution
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_same_campus" ON listings
    FOR SELECT USING (
        institution_domain = (SELECT institution_domain FROM users WHERE id = auth.uid())
    );

-- Users can only modify their own listings
CREATE POLICY "listings_owner_modify" ON listings
    FOR ALL USING (seller_id = auth.uid());
