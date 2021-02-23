import type { RequestResultsWithData } from './lib';

/**
 * Enum for the event station type.
 * @readonly
 * @enum {string}
 */
export enum EventStationType
{
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    UNLOCKED = 'unlocked',
    LOCKED = 'locked',
    BOOT = 'boot',
    STATE = 'state',
    SHAKE = 'shake',
    HIGH_TEMP = 'high-temp',
    ENERGY_CRITICAL = 'critical-energy',
    UNEXPECTED_UNLOCK = 'unexpected-unlock',
    SPOT_DEFECT = 'spot-defect',
    BADGE_RFID = 'badge-rfid'
}

/**
 * Enum for the station confirm lock.
 * @readonly
 * @enum {number}
 */
export enum ConfirmLockAnswer
{
    ACCEPT = 0,
    ACCEPT_CACHE = 1,
    DENY = 2,
}

/**
 * Enum for the station badge reader status.
 * @readonly
 * @enum {number}
 */
export enum BadgeReaderStatus
{
    LINK = 0,
    SUCCEEDED = 1,
    FAILED = 2
}

/**
 * Base type for station events.
 */
type EventStationBase = {
    event: EventStationType;
    station: number;
}

/**
 * Type for the station connected event.
 */
export type ConnectedStationEvent = EventStationBase & {
    event: EventStationType.CONNECTED;
};

/**
 * Type for the station disconnected event.
 */
export type DisconnectedStationEvent = EventStationBase & {
    event: EventStationType.DISCONNECTED;
    data: {
        reason: string;
        error: boolean;
    };
};

/**
 * Type for the station unlocked event.
 */
export type UnlockedStationEvent = EventStationBase & {
    event: EventStationType.UNLOCKED;
    data: {
        spot: number;
        unlock: number;
    };
};

/**
 * Type for the station locked event.
 */
export type LockedStationEvent = {
    event: EventStationType.LOCKED;
    data: {
        spot: number;
        vehicle: number;
        cache_accepted: boolean;
        time: number;
    };
};

/**
 * Type for the station boot event.
 */
export type BootStationEvent = EventStationBase & {
    event: EventStationType.BOOT;
};

/**
 * Type for the station state event.
 */
export type StateStationEvent = EventStationBase & {
    event: EventStationType.STATE;
    data: {
        mainboard: number;
        vehicles: number[];
    };
};

/**
 * Type for the station shake event.
 */
export type ShakeStationEvent = EventStationBase & {
    event: EventStationType.SHAKE;
};

/**
 * Type for the high station temperature event.
 */
export type HighTempStationEvent = EventStationBase & {
    event: EventStationType.HIGH_TEMP;
    data: {
        temperature: number;
        critical: boolean;
    };
};

/**
 * Type for the station critical energy event.
 */
export type CriticalEnergyStationEvent = EventStationBase & {
    event: EventStationType.ENERGY_CRITICAL;
};

/**
 * Type for the station unexpected unlock event.
 */
export type UnexpectedUnlockStationEvent = EventStationBase & {
    event: EventStationType.UNEXPECTED_UNLOCK;
    data: {
        spot: number;
    };
};

/**
 * Type for the station spot defect event.
 */
export type SpotDefectStationEvent = EventStationBase & {
    event: EventStationType.SPOT_DEFECT;
    data: {
        spot: number;
        vehicle: number;
        vehicle_voltage: number;
        lock_status: number;
    };
};

/**
 * Type for the station badge reading event.
 */
export type BadgeRFIDStationEvent = EventStationBase & {
    event: EventStationType.BADGE_RFID;
    data: {
        badge_id: string;
    };
};

/**
 * Type grouping all station events.
 */
export type KnotStationEvent = ConnectedStationEvent | DisconnectedStationEvent | UnlockedStationEvent | LockedStationEvent | BootStationEvent | StateStationEvent | ShakeStationEvent | HighTempStationEvent | CriticalEnergyStationEvent | UnexpectedUnlockStationEvent | SpotDefectStationEvent | BadgeRFIDStationEvent;


/**
 * Disabled stations interface
 * @interface
 */
interface DisabledStationsInterface
{
    station_id: number;
    spots_count: number;
}
/**
 * Station information interface
 * @interface
 */
interface StationInformationInterface extends DisabledStationsInterface
{
    station_id: number;
    model_name: string;
    manufacturer: string;
    model_type: string;
    activation_date: Date | null;
    online: boolean;
    spots_count: number;
    spots: {
        spot_id: number;
        vehicle: number | null;
        lock: 0 | 1;
    }[];
}
/**
 * Enabled stations interface
 * @interface
 */
interface EnabledStationsInterface extends DisabledStationsInterface
{
    activation_date: Date;
    online: boolean;
}

/**
 * Type describing the data returned when requesting information about a station.
 */
export type StationInformation = RequestResultsWithData<StationInformationInterface>;
/**
 * Type describing the data returned when requesting list of the enabled stations.
 */
export type EnabledStations = RequestResultsWithData<EnabledStationsInterface[]>;
/**
 * Type describing the data returned when requesting list of the disabled stations.
 */
export type DisabledStations = RequestResultsWithData<DisabledStationsInterface[]>;

/**
 * Station configuration types.
 */
export type StationConfigType = 'volume';
