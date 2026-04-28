-- Function to format the RA with the client's CNPJ
CREATE OR REPLACE FUNCTION public.format_claim_ra()
RETURNS TRIGGER AS $$
DECLARE
    client_cnpj TEXT;
BEGIN
    -- Obter o CNPJ do cliente selecionado
    IF NEW.client_id IS NOT NULL THEN
        SELECT "CNPJ" INTO client_cnpj FROM public.clients WHERE id::text = NEW.client_id LIMIT 1;
        
        IF client_cnpj IS NOT NULL AND client_cnpj != '' THEN
            -- Anexar o CNPJ caso ainda não esteja presente
            IF NEW.ra NOT LIKE '%' || client_cnpj || '%' THEN
                NEW.ra := NEW.ra || '-' || client_cnpj;
            END IF;
            
            -- Garantir o padrão de prefixo 'RA - '
            IF NEW.ra NOT ILIKE 'RA%' THEN
                NEW.ra := 'RA - ' || NEW.ra;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove the trigger if it already exists to ensure idempotency
DROP TRIGGER IF EXISTS trigger_format_claim_ra ON public.claims;

-- Create the trigger
CREATE TRIGGER trigger_format_claim_ra
    BEFORE INSERT OR UPDATE OF client_id, ra
    ON public.claims
    FOR EACH ROW
    EXECUTE FUNCTION public.format_claim_ra();

-- Block to update existing claims in the database
DO $$
DECLARE
    claim_record RECORD;
    client_cnpj TEXT;
    new_ra TEXT;
BEGIN
    FOR claim_record IN SELECT id, ra, client_id FROM public.claims WHERE client_id IS NOT NULL LOOP
        SELECT "CNPJ" INTO client_cnpj FROM public.clients WHERE id::text = claim_record.client_id LIMIT 1;
        
        IF client_cnpj IS NOT NULL AND client_cnpj != '' THEN
            new_ra := claim_record.ra;
            
            IF new_ra NOT LIKE '%' || client_cnpj || '%' THEN
                new_ra := new_ra || '-' || client_cnpj;
            END IF;
            
            IF new_ra NOT ILIKE 'RA%' THEN
                new_ra := 'RA - ' || new_ra;
            END IF;
            
            IF new_ra != claim_record.ra THEN
                UPDATE public.claims SET ra = new_ra WHERE id = claim_record.id;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
