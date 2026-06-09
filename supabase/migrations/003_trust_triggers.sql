-- Function to notify the trust_recompute channel with the seller's user ID
CREATE OR REPLACE FUNCTION public.notify_trust_recompute()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('trust_recompute', NEW.seller_id::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function on any insert or update on the transactions table
CREATE OR REPLACE TRIGGER trg_transaction_trust
    AFTER INSERT OR UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.notify_trust_recompute();
