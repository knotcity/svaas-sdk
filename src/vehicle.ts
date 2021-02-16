import type { RequestResultsWithData } from './lib';

/**
 * Enum for the vehicle event type.
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
 * Type for the vehicle unlocked event.
 */
export type UnlockedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.UNLOCKED,
    data: {
        unlock: number,
        time: number
    }
};

/**
 * Type for the vehicle locked event.
 */
export type LockedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.LOCKED,
    data: {
        lock: number,
        time: number
    }
};

/**
 * Type for the vehicle location event.
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
 * Type for the vehicle status event.
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
 * Type for the vehicle lock failed event.
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
 * Disabled vehicles interface
 * @interface
 */
interface DisabledVehiclesInterface
{
    vehicle_id: number
}
/**
 * Vehicle information interface
 * @interface
 */
interface VehicleInformationInterface extends DisabledVehiclesInterface
{
    model_name: string,
    activation_date: Date | null,
    model_type: string,
    manufacturer: string
}
/**
 * Enabled vehicles interface
 * @interface
 */
interface EnabledVehiclesInterface extends DisabledVehiclesInterface
{
    activation_date: Date
}

/**
 * Type describing the data returned when requesting information about a vehicle.
 */
export type VehicleInformation = RequestResultsWithData<VehicleInformationInterface>;
/**
 * Type describing the data returned when requesting list of the enabled vehicles.
 */
export type EnabledVehicles = RequestResultsWithData<EnabledVehiclesInterface[]>;
/**
 * Type describing the data returned when requesting list of the disabled vehicles.
 */
export type DisabledVehicles = RequestResultsWithData<DisabledVehiclesInterface[]>;
