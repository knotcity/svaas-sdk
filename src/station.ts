import type { RequestResultsWithData } from './lib.js';

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
    UNEXPECTED_UNLOCK = 'unexpected-unlock',
    BADGE_RFID = 'badge-rfid',
    CONFIGURED = 'configured',
    CONFIG_FAILED = 'config-failed',
    ALERT = 'alert',
    FAULT = 'fault',

    /** @deprecated use ALERT event instead */
    SHAKE = 'shake',
    /** @deprecated use ALERT event instead */
    ENERGY_CRITICAL = 'critical-energy',
    /** @deprecated use ALERT event instead */
    HIGH_TEMP = 'high-temp',
    /** @deprecated use ALERT event instead */
    SPOT_DEFECT = 'spot-defect',
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
        identifiedByLocation: boolean | undefined;
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
        mainboard: {
            v5: number;
            v48: number;
            temp: number;
        };
        vehicles: Array<{
            vehicle: number | null;
            voltage: number;
            battery: number | null;
        }>;
        connectivity: {
            type: 'GSM' | 'CAT-M1' | 'CAT-NB1';
            rssi: number;
            rsrp: number;
        } | undefined;
        energy: {
            total_active_energy: number;
            total_apparent_energy: number;
        } | undefined;
    };
};

/**
 * Type for the station shake event.
 * @deprecated use ALERT event instead
 */
export type ShakeStationEvent = EventStationBase & {
    event: EventStationType.SHAKE;
};

/**
 * Type for the high station temperature event.
 * @deprecated use ALERT event instead
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
 * @deprecated use ALERT event instead
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
 * @deprecated use ALERT event instead
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
        spot?: number; // Absent in v5 stations, present in v6 stations.
    };
};

/**
 * Type for the station configured event.
 */
export type StationConfiguredEvent = EventStationBase & {
    event: EventStationType.CONFIGURED;
    data: {
        type: string;
        value: number;
    };
};

/**
 * Type for the station config-failed event.
 */
export type StationConfigFailedEvent = EventStationBase & {
    event: EventStationType.CONFIG_FAILED;
    data: {
        type: string;
        value: number;
    };
};

/**
 * Type for the station alert event.
 */
export type StationAlertEvent = EventStationBase & {
    event: EventStationType.ALERT;
    data: {
        alert: StationAlertCode;
        alertName: string;
        alertStatus: StationFaultStatus;
        spot: number | undefined;
    };
};

/**
 * Type for the station fault event.
 */
export type StationFaultEvent = EventStationBase & {
    event: EventStationType.FAULT;
    data: {
        fault: StationFaultCode;
        faultName: string;
        faultStatus: StationFaultStatus;
        spot: number | undefined;
    };
};
/**
 * Type grouping all station events.
 */
export type KnotStationEvent = ConnectedStationEvent | DisconnectedStationEvent | UnlockedStationEvent | LockedStationEvent | BootStationEvent | StateStationEvent | ShakeStationEvent | HighTempStationEvent | CriticalEnergyStationEvent | UnexpectedUnlockStationEvent | SpotDefectStationEvent | BadgeRFIDStationEvent | StationConfiguredEvent | StationConfigFailedEvent | StationAlertEvent | StationFaultEvent;

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
export type StationConfigType = 'volume' | 'alarm-threshold';

/**
 * Enum for the station alerts code.
 * @readonly
 * @enum {number}
 */
export enum StationAlertCode
{
    SHAKE = 0,
    POWER_CUT = 1,
    HIGH_TEMP = 2,
    INCORRECT_LOCK = 3,
}

/**
 * Enum for the station fault (and station alert) status.
 * @readonly
 * @enum {string}
 */
export enum StationFaultStatus
{
    APPEARING = 'appearing',
    DISAPPEARED = 'disappeared',
}

/**
 * Enum for the station faults code.
 * @readonly
 * @enum {number}
 */
export enum StationFaultCode
{
    COMMUNICATION_FAULT = 0,
    CHARGE_FAULT = 1,
    ABNORMAL_LOW_VOLTAGE = 2,
    ABNORMAL_HIGH_VOLTAGE = 3
}
