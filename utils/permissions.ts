import { UserProfile, UserPermissions } from '../types';

export const getUserPermissions = (user: UserProfile | null): UserPermissions => {
    if (!user) return {};

    // 1. Super Admin: God Mode
    if (user.role === 'super_admin') {
        return {
            daily_allowance: { view: true, manage: true },
            purchase_request: { view: true, manage: true },
            contracts: { view: true, manage: true },
            biddings: { view: true, manage: true },
            minutes: { view: true, manage: true },
            utility_bills: { view: true, manage: true },
            supplementation: { view: true, manage: true },
            fiscalization: { view: true, manage: true },
            pgm_dispatch: { view: true, manage: true },
            users: { view: true, manage: true },
            fuel_management: { view: true, manage: true },
            vehicle_maintenance: { view: true, manage: true }
        };
    }

    // 2. Base Defaults (Legacy transition: 'admin' role gets some defaults, 'user' gets restricted)
    // We strictly use the database permissions, defaulting to FALSE if not present,
    // except for View which we might desire to be open by default?
    // User requested "select what he can or cannot see", so default VIEW should probably be FALSE or configurable.
    // However, to avoid breaking everything immediately for existing users without permissions set:
    // We will default VIEW to TRUE for core modules, but MANAGE to FALSE.
    const defaults: UserPermissions = {
        daily_allowance: { view: true, manage: false },
        purchase_request: { view: true, manage: false },
        contracts: { view: true, manage: false },
        biddings: { view: true, manage: false },
        minutes: { view: true, manage: false },
        utility_bills: { view: true, manage: false },
        supplementation: { view: true, manage: false },
        fiscalization: { view: false, manage: false }, // Advanced modules hidden by default
        pgm_dispatch: { view: false, manage: false },
        users: { view: false, manage: false },
        fuel_management: { view: true, manage: false },
        vehicle_maintenance: { view: true, manage: false }
    };

    // 3. Apply Explicit Overrides from Database
    // This allows granular control: if DB says view: false, it overrides the default true.
    // MODIFIED: If user has a 'permissions' object, we assume they are under the new strict system.
    // Anything not explicitly set to TRUE in the object is FALSE.
    if (user.permissions) {
        return {
            daily_allowance: {
                view: user.permissions.daily_allowance?.view || false,
                manage: user.permissions.daily_allowance?.manage || false
            },
            purchase_request: {
                view: user.permissions.purchase_request?.view || false,
                manage: user.permissions.purchase_request?.manage || false
            },
            contracts: {
                view: user.permissions.contracts?.view || false,
                manage: user.permissions.contracts?.manage || false
            },
            biddings: {
                view: user.permissions.biddings?.view || false,
                manage: user.permissions.biddings?.manage || false
            },
            minutes: {
                view: user.permissions.minutes?.view || false,
                manage: user.permissions.minutes?.manage || false
            },
            utility_bills: {
                view: user.permissions.utility_bills?.view || false,
                manage: user.permissions.utility_bills?.manage || false
            },
            supplementation: {
                view: user.permissions.supplementation?.view || false,
                manage: user.permissions.supplementation?.manage || false
            },
            fiscalization: {
                view: user.permissions.fiscalization?.view || false,
                manage: user.permissions.fiscalization?.manage || false
            },
            pgm_dispatch: {
                view: user.permissions.pgm_dispatch?.view || false,
                manage: user.permissions.pgm_dispatch?.manage || false
            },
            users: {
                view: user.permissions.users?.view || false,
                manage: user.permissions.users?.manage || false
            },
            fuel_management: {
                view: user.permissions.fuel_management?.view || false,
                manage: user.permissions.fuel_management?.manage || false
            },
            vehicle_maintenance: {
                view: user.permissions.vehicle_maintenance?.view || false,
                manage: user.permissions.vehicle_maintenance?.manage || false
            }
        };
    }

    return defaults;
};
