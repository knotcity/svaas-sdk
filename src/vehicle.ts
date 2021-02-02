import type { RequestResults } from './index';

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

export enum VehicleSoundType
{
    GEO_FENCE = 'geo-fence',
    TOOT = 'toot',
    LOW_BATTERY = 'low_battery'
}


type EventVehicleBase = {
    event: EventVehicleType,
    vehicle: number
}

export type UnlockedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.UNLOCKED,
    data: {
        unlock: number,
        time: number
    }
};

export type LockedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.LOCKED,
    data: {
        lock: number,
        time: number
    }
};

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

export type StatusVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.STATUS,
    data: {
        online: boolean,
        locked: boolean,
        batteryPercentage: number,
        odometer: number
    }
};

export type LockFailedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.LOCK_FAILED,
    data: {
        message: string
    }
};

export type KnotVehicleEvent = UnlockedVehicleEvent | LockedVehicleEvent | LocationVehicleEvent | StatusVehicleEvent | LockFailedVehicleEvent;

export type VehicleInformation = RequestResults<{ model_name: string, activation_date: Date | null, vehicle_id: number, model_type: string, manufacturer: string }>;
export type EnabledVehicles = RequestResults<{ vehicle_id: number, activation_date: Date }[]>;
export type DisabledVehicles = RequestResults<{ vehicle_id: number }[]>;
