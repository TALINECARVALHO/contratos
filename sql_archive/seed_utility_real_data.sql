-- Seed real data from spreadsheet image
-- Focus: Educação (Luz)

DO $$
DECLARE
    comm_1474_id UUID;
    comm_1479_id UUID;
    comm_1475_id UUID;
    comm_1480_id UUID;
BEGIN
    -- 1. Create Commitments (Empenhos)
    
    INSERT INTO public.utility_commitments (number, type, department, dotation, total_value, balance, notes)
    VALUES ('2025/1474', 'light', 'Educação', '306', 50000.00, 50000.00, 'Consumo de Energia Elétrica - Escolas (Grupo 1)')
    RETURNING id INTO comm_1474_id;

    INSERT INTO public.utility_commitments (number, type, department, dotation, total_value, balance, notes)
    VALUES ('2025/1479', 'light', 'Educação', '419', 12000.00, 12000.00, 'Consumo de Energia Elétrica - Escolas (Grupo 2)')
    RETURNING id INTO comm_1479_id;

    INSERT INTO public.utility_commitments (number, type, department, dotation, total_value, balance, notes)
    VALUES ('2025/1475', 'light', 'Educação', '331', 68000.00, 68000.00, 'Consumo de Energia Elétrica - Escolas (Grupo 3)')
    RETURNING id INTO comm_1475_id;

    INSERT INTO public.utility_commitments (number, type, department, dotation, total_value, balance, notes)
    VALUES ('2025/1480', 'light', 'Educação', '270', 15600.00, 15600.00, 'Secretaria de Educação')
    RETURNING id INTO comm_1480_id;

    -- 2. Create Bills (Contas) for Group 1474
    -- Escola N. Sra. do Rosário (3085380091)
    INSERT INTO public.utility_bills (type, company, consumer_unit, local_name, reference_month, due_date, value, status, commitment_id)
    VALUES 
    ('light', 'RGE', '3085380091', 'ESCOLA NOSSA SENHORA DO ROSARIO', '01/2025', '2025-01-22', 151.88, 'paid', comm_1474_id),
    ('light', 'RGE', '3085380091', 'ESCOLA NOSSA SENHORA DO ROSARIO', '02/2025', '2025-02-22', 130.44, 'paid', comm_1474_id),
    ('light', 'RGE', '3085380091', 'ESCOLA NOSSA SENHORA DO ROSARIO', '03/2025', '2025-03-22', 156.69, 'paid', comm_1474_id),
    ('light', 'RGE', '3085380091', 'ESCOLA NOSSA SENHORA DO ROSARIO', '04/2025', '2025-04-22', 158.46, 'paid', comm_1474_id),
    ('light', 'RGE', '3085380091', 'ESCOLA NOSSA SENHORA DO ROSARIO', '05/2025', '2025-05-22', 189.99, 'paid', comm_1474_id);

    -- Escola Vó Benvinda (3085380530)
    INSERT INTO public.utility_bills (type, company, consumer_unit, local_name, reference_month, due_date, value, status, commitment_id)
    VALUES 
    ('light', 'RGE', '3085380530', 'ESCOLA VÓ BENVINDA', '01/2025', '2025-01-22', 140.23, 'paid', comm_1474_id),
    ('light', 'RGE', '3085380530', 'ESCOLA VÓ BENVINDA', '02/2025', '2025-02-22', 110.42, 'paid', comm_1474_id),
    ('light', 'RGE', '3085380530', 'ESCOLA VÓ BENVINDA', '03/2025', '2025-03-22', 231.57, 'paid', comm_1474_id);

    -- 3. Create Bills for Group 1479
    -- Escola Mercedes (3080830907)
    INSERT INTO public.utility_bills (type, company, consumer_unit, local_name, reference_month, due_date, value, status, commitment_id)
    VALUES 
    ('light', 'RGE', '3080830907', 'ESCOLA MERCEDES', '01/2025', '2025-01-22', 109.78, 'paid', comm_1479_id),
    ('light', 'RGE', '3080830907', 'ESCOLA MERCEDES', '02/2025', '2025-02-22', 117.65, 'paid', comm_1479_id);

    -- 4. Create Bills for Group 1475
    -- Escola Daltro Filho (3083342383)
    INSERT INTO public.utility_bills (type, company, consumer_unit, local_name, reference_month, due_date, value, status, commitment_id)
    VALUES 
    ('light', 'RGE', '3083342383', 'ESCOLA DALTRO FILHO', '01/2025', '2025-01-21', 114.61, 'paid', comm_1475_id),
    ('light', 'RGE', '3083342383', 'ESCOLA DALTRO FILHO', '02/2025', '2025-02-21', 123.74, 'paid', comm_1475_id);

    -- Secretaria de Educação (3080837760)
    INSERT INTO public.utility_bills (type, company, consumer_unit, local_name, reference_month, due_date, value, status, commitment_id)
    VALUES 
    ('light', 'RGE', '3080837760', 'SECRETARIA DE EDUCAÇÃO', '02/2025', '2025-02-22', 148.80, 'paid', comm_1480_id),
    ('light', 'RGE', '3080837760', 'SECRETARIA DE EDUCAÇÃO', '03/2025', '2025-03-22', 156.90, 'paid', comm_1480_id);

END $$;
