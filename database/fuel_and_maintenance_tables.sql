-- Tabelas para Gestão de Combustível

-- Tabela de Empenhos de Combustível
CREATE TABLE IF NOT EXISTS fuel_commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT NOT NULL,
    department TEXT NOT NULL,
    dotation TEXT,
    total_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Lançamentos Mensais de Combustível
CREATE TABLE IF NOT EXISTS fuel_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commitment_id UUID REFERENCES fuel_commitments(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    reference_month TEXT NOT NULL,
    total_liters DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
    details JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas para Manutenção de Veículos

-- Tabela de Veículos
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    department TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'car' CHECK (type IN ('car', 'truck', 'motorcycle', 'bus', 'other')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Manutenções de Veículos
CREATE TABLE IF NOT EXISTS vehicle_maintenances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_plate TEXT NOT NULL,
    requesting_department TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'corrective' CHECK (type IN ('preventive', 'corrective')),
    request_date DATE NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'in_progress', 'completed', 'paid')),
    rejection_reason TEXT,
    execution_date DATE,
    odometer INTEGER,
    service_provider TEXT,
    items JSONB DEFAULT '[]',
    total_value DECIMAL(12, 2) DEFAULT 0,
    commitment_number TEXT,
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_fuel_commitments_department ON fuel_commitments(department);
CREATE INDEX IF NOT EXISTS idx_fuel_records_commitment ON fuel_records(commitment_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_department ON fuel_records(department);
CREATE INDEX IF NOT EXISTS idx_fuel_records_month ON fuel_records(reference_month);
CREATE INDEX IF NOT EXISTS idx_vehicles_department ON vehicles(department);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_vehicle ON vehicle_maintenances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_department ON vehicle_maintenances(requesting_department);
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_status ON vehicle_maintenances(status);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fuel_commitments_updated_at BEFORE UPDATE ON fuel_commitments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_records_updated_at BEFORE UPDATE ON fuel_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_maintenances_updated_at BEFORE UPDATE ON vehicle_maintenances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE fuel_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenances ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (ajuste conforme necessário)
CREATE POLICY "Enable read access for all authenticated users" ON fuel_commitments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON fuel_commitments FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all authenticated users" ON fuel_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON fuel_records FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all authenticated users" ON vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON vehicles FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all authenticated users" ON vehicle_maintenances FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON vehicle_maintenances FOR ALL USING (auth.role() = 'authenticated');
