import { supabase } from './supabaseClient';
import { Vehicle, VehicleMaintenance } from '../types';

// ============================================
// VEHICLES (Veículos)
// ============================================

export const fetchVehicles = async (): Promise<Vehicle[]> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('plate', { ascending: true });

    if (error) throw error;
    return data || [];
};

export const createVehicle = async (vehicle: Partial<Vehicle>): Promise<Vehicle> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('vehicles')
        .insert({
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            department: vehicle.department,
            type: vehicle.type,
            status: vehicle.status || 'active',
            notes: vehicle.notes
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateVehicle = async (vehicle: Vehicle): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('vehicles')
        .update({
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            department: vehicle.department,
            type: vehicle.type,
            status: vehicle.status,
            notes: vehicle.notes
        })
        .eq('id', vehicle.id);

    if (error) throw error;
};

export const deleteVehicle = async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// ============================================
// VEHICLE MAINTENANCES (Manutenções)
// ============================================

export const fetchVehicleMaintenances = async (): Promise<VehicleMaintenance[]> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('vehicle_maintenances')
        .select('*')
        .order('request_date', { ascending: false });

    if (error) throw error;
    return data || [];
};

export const createVehicleMaintenance = async (maintenance: Partial<VehicleMaintenance>): Promise<VehicleMaintenance> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { data, error } = await supabase
        .from('vehicle_maintenances')
        .insert({
            vehicle_id: maintenance.vehicle_id,
            vehicle_plate: maintenance.vehicle_plate,
            requesting_department: maintenance.requesting_department,
            type: maintenance.type,
            request_date: maintenance.request_date,
            description: maintenance.description,
            priority: maintenance.priority || 'medium',
            status: maintenance.status || 'requested',
            notes: maintenance.notes
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateVehicleMaintenance = async (maintenance: VehicleMaintenance): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('vehicle_maintenances')
        .update({
            vehicle_id: maintenance.vehicle_id,
            vehicle_plate: maintenance.vehicle_plate,
            requesting_department: maintenance.requesting_department,
            type: maintenance.type,
            request_date: maintenance.request_date,
            description: maintenance.description,
            priority: maintenance.priority,
            execution_date: maintenance.execution_date,
            odometer: maintenance.odometer,
            service_provider: maintenance.service_provider,
            total_value: maintenance.total_value,
            items: maintenance.items,
            commitment_number: maintenance.commitment_number,
            status: maintenance.status,
            rejection_reason: maintenance.rejection_reason,
            payment_date: maintenance.payment_date,
            notes: maintenance.notes,
            updated_at: new Date().toISOString()
        })
        .eq('id', maintenance.id);

    if (error) throw error;
};

export const deleteVehicleMaintenance = async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');

    const { error } = await supabase
        .from('vehicle_maintenances')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
