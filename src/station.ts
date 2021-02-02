import type { RequestResults } from './index';

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

export enum ConfirmLockAnswer
{
    ACCEPT = 0,
    SILENT_ACCEPT = 1,
    DENY = 2,
}

export const enum BadgeReaderStatus
{
    LINK = 0,
    SUCCEEDED = 1,
    FAILED = 2
}

type EventStationBase = {
    event: EventStationType,
    station: number
}

export type ConnectedStationEvent = EventStationBase & {
    event: EventStationType.CONNECTED,
};

export type DisconnectedStationEvent = EventStationBase & {
    event: EventStationType.DISCONNECTED,
    data: {
        reason: string,
        error: boolean
    }
};

export type UnlockedStationEvent = EventStationBase & {
    event: EventStationType.UNLOCKED,
    data: {
        spot: number,
        unlock: number
    }
};

export type LockedStationEvent = {
    event: EventStationType.LOCKED,
    data: {
        spot: number,
        vehicle: number,
        cache_accepted: boolean,
        time: number
    }
};

export type BootStationEvent = EventStationBase & {
    event: EventStationType.BOOT,
};

export type StateStationEvent = EventStationBase & {
    event: EventStationType.STATE,
    data: {
        mainboard: number,
        vehicles: number[]
    }
};

export type ShakeStationEvent = EventStationBase & {
    event: EventStationType.SHAKE,
};

export type HighTempStationEvent = EventStationBase & {
    event: EventStationType.HIGH_TEMP,
    data: {
        temperature: number,
        critical: boolean
    }
};

export type CriticalEnergyStationEvent = EventStationBase & {
    event: EventStationType.ENERGY_CRITICAL,
};

export type UnexpectedUnlockStationEvent = EventStationBase & {
    event: EventStationType.UNEXPECTED_UNLOCK,
    data: {
        spot: number
    }
};

export type SpotDefectStationEvent = EventStationBase & {
    event: EventStationType.SPOT_DEFECT,
    data: {
        spot: number,
        vehicle: number,
        vehicle_voltage: number,
        lock_status: number
    }
};

export type BadgeRFIDStationEvent = EventStationBase & {
    event: EventStationType.BADGE_RFID,
    data: {
        badge_id: string
    }
};

export type KnotStationEvent = ConnectedStationEvent | DisconnectedStationEvent | UnlockedStationEvent | LockedStationEvent | BootStationEvent | StateStationEvent | ShakeStationEvent | HighTempStationEvent | CriticalEnergyStationEvent | UnexpectedUnlockStationEvent | SpotDefectStationEvent | BadgeRFIDStationEvent;

export type StationInformation = RequestResults<{ spots_count: number, model_name: string, activation_date: Date | null, station_id: number, model_type: string, manufacturer: string }>;
export type EnabledStations = RequestResults<{ station_id: number, spots_count: number, activation_date: Date }[]>;
export type DisabledStations = RequestResults<{ station_id: number, spots_count: number }[]>;

export type StationConfigType = 'volume';
