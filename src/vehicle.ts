import type { RequestResults } from './index';

/**
 * Enum for the event vehicle type.
 * @readonly
 * @enum {string}
 */
export enum EventVehicleType
{
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    UNLOCKED = 'unlocked',
    LOCKED = 'locked',
    LOCATION = 'location',
    STATUS = 'status',
    LOCK_FAILED = 'lock-failed'
}

/**
 * Enum for the vehicle sound type.
 * @readonly
 * @enum {string}
 */
export enum VehicleSoundType
{
    GEO_FENCE = 'geo-fence',
    TOOT = 'toot',
    LOW_BATTERY = 'low_battery'
}

/**
 * Base type for vehicle events.
 */
type EventVehicleBase = {
    event: EventVehicleType,
    vehicle: number
}

/**
 * Type for the unlocked vehicle events.
 */
export type UnlockedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.UNLOCKED,
    data: {
        unlock: number,
        time: number
    }
};

/**
 * Type for the locked vehicle events.
 */
export type LockedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.LOCKED,
    data: {
        lock: number,
        time: number
    }
};

/**
 * Type for the location vehicle events.
 */
export type LocationVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.LOCATION,
    data: {
        status: 'valid',
        latitude: number,
        longitude: number
    } | {
        status: 'invalid',
    }
};

/**
 * Type for the status vehicle events.
 */
export type StatusVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.STATUS,
    data: {
        online: boolean,
        locked: boolean,
        batteryPercentage: number,
        odometer: number
    }
};

/**
 * Type for the lock failed vehicle events.
 */
export type LockFailedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.LOCK_FAILED,
    data: {
        message: string
    }
};

/**
 * Type grouping all vehicle events.
 */
export type KnotVehicleEvent = UnlockedVehicleEvent | LockedVehicleEvent | LocationVehicleEvent | StatusVehicleEvent | LockFailedVehicleEvent;

/**
 * Type describing the data returned when requesting information about a vehicle.
 */
export type VehicleInformation = RequestResults<{ model_name: string, activation_date: Date | null, vehicle_id: number, model_type: string, manufacturer: string }>;
/**
 * Type describing the data returned when requesting list of the enabled vehicles.
 */
export type EnabledVehicles = RequestResults<{ vehicle_id: number, activation_date: Date }[]>;
/**
 * Type describing the data returned when requesting list of the disabled vehicles.
 */
export type DisabledVehicles = RequestResults<{ vehicle_id: number }[]>;
