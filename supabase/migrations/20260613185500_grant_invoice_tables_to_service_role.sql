-- Ensure backend service role can manage invoice-related tables.
-- RLS policies control row-level access; table privileges are still required.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.bikes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.parts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.invoice_line_items TO service_role;

GRANT USAGE, SELECT ON SEQUENCE public.invoices_invoice_number_seq TO service_role;
