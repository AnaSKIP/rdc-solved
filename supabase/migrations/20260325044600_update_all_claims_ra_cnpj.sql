-- Block to update all existing claims in the database to ensure RA has CNPJ appended
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
            
            -- Ensure CNPJ suffix
            IF new_ra NOT LIKE '%' || client_cnpj || '%' THEN
                new_ra := new_ra || '-' || client_cnpj;
            END IF;
            
            -- Ensure RA prefix
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
