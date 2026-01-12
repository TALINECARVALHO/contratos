import { supabase } from './supabaseClient';
import { PurchaseRequest, PurchaseOrder } from '../types';

export const fetchPurchaseRequests = async () => {
    // Select requests and join with orders
    const { data, error } = await supabase
        .from('purchase_requests')
        .select(`
            *,
            orders:purchase_orders(*),
            requester:profiles(name)
        `)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching purchase requests:', error);
        throw error;
    }
    return data as PurchaseRequest[];
};

export const createPurchaseRequest = async (request: Omit<PurchaseRequest, 'id' | 'orders'>) => {
    // Ensure we don't send the expanded requester object
    const { requester, ...requestData } = request as any; // Cast to access optional property that might be passed

    const { data, error } = await supabase
        .from('purchase_requests')
        .insert([requestData])
        .select()
        .single();

    if (error) {
        console.error('Error creating purchase request:', error);
        throw error;
    }
    return data as PurchaseRequest;
};

export const updatePurchaseRequest = async (request: PurchaseRequest) => {
    // Remove orders and requester object from the object before updating the request table to avoid errors
    const { orders, requester, ...requestData } = request;

    // We only update the main fields here. Orders are handled separately via syncPurchaseOrders.
    const { data, error } = await supabase
        .from('purchase_requests')
        .update(requestData)
        .eq('id', request.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating purchase request:', error);
        throw error;
    }
    return data as PurchaseRequest;
};

export const deletePurchaseRequest = async (id: string) => {
    const { error } = await supabase
        .from('purchase_requests')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting purchase request:', error);
        throw error;
    }
};

// --- Orders Management ---

export const createPurchaseOrder = async (order: Omit<PurchaseOrder, 'id'>) => {
    const { data, error } = await supabase
        .from('purchase_orders')
        .insert([order])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updatePurchaseOrder = async (order: PurchaseOrder) => {
    const { data, error } = await supabase
        .from('purchase_orders')
        .update(order)
        .eq('id', order.id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deletePurchaseOrder = async (id: string) => {
    const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);

    if (error) throw error;
};
