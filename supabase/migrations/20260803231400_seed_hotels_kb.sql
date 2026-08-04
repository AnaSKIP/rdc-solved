-- Seed travel_hotels_kb with known hotel data for vistorias destinations
INSERT INTO public.travel_hotels_kb (destination, hotel_name, address, phone, price_range, notes, link_ref)
VALUES
  ('Ribeirão Preto / São Carlos', 'Hotel Sugerido 1', '', '', 'A consultar', 'Hotel sugerido para vistorias na região de Ribeirão Preto / São Carlos', ''),
  ('Ribeirão Preto / São Carlos', 'Hotel Sugerido 2', '', '', 'A consultar', 'Hotel sugerido para vistorias na região de Ribeirão Preto / São Carlos', ''),
  ('Belo Horizonte', 'Hotel Gran Vivenzo', '', '', 'A consultar', 'Opção de hospedagem em Belo Horizonte para vistorias', ''),
  ('Belo Horizonte', 'Savassi Hotel', '', '', 'A consultar', 'Opção de hospedagem em Belo Horizonte para vistorias', ''),
  ('Belo Horizonte', 'Ibis', '', '', 'A consultar', 'Opção de hospedagem em Belo Horizonte para vistorias', ''),
  ('Vitória', 'Vitória Praia Hotel', '', '', 'A consultar', 'Opção de hospedagem em Vitória para vistorias', ''),
  ('Vitória', 'Alameda Vitória Hotel', '', '', 'A consultar', 'Opção de hospedagem em Vitória para vistorias', ''),
  ('Vila Velha', 'Hotel Santorini', '', '', 'A consultar', 'Opção de hospedagem em Vila Velha para vistorias', '')
ON CONFLICT DO NOTHING;
