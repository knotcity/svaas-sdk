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
 * Enum for the vehicle sound type.
 * @readonly
 * @enum {string}
 */
export enum VehicleLightState
{
    OFF = 'off',
    ON = 'on',
    FLICKER = 'flicker'
}

/**
 * Enum for the vehicle speed mode.
 * @readonly
 * @enum {string}
 */
export enum VehicleSpeedMode
{
    ECO = 1,
    NORMAL = 2,
    SPORT = 3
}

/**
 * Base type for vehicle events.
 */
type EventVehicleBase = {
    event: EventVehicleType;
    vehicle: number;
}

/**
 * Type for the vehicle unlocked event.
 */
export type UnlockedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.UNLOCKED;
    data: {
        unlock: number;
        time: number;
    };
};

/**
 * Type for the vehicle locked event.
 */
export type LockedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.LOCKED;
    data: {
        lock: number;
        time: number;
    };
};

/**
 * Type for the vehicle location event.
 */
export type LocationVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.LOCATION;
    data: {
        status: 'valid';
        latitude: number;
        longitude: number;
    } | {
        status: 'invalid';
    };
};

/**
 * Type for the vehicle status event.
 */
export type StatusVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.STATUS;
    data: {
        online: boolean;
        locked: boolean;
        batteryPercentage: number;
        odometer: number;
    };
};

/**
 * Type for the vehicle lock failed event.
 */
export type LockFailedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.LOCK_FAILED;
    data: {
        message: string;
    };
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
    vehicle_id: number;
    imei: string;
}
/**
 * Vehicle information interface
 * @interface
 */
interface VehicleInformationInterface extends DisabledVehiclesInterface
{
    vehicle_id: number;
    model_name: string;
    activation_date: Date | null;
    model_type: string;
    manufacturer: string;
    imei: string;
    online: boolean | null;
    locked: boolean | null;
}
/**
 * Enabled vehicles interface
 * @interface
 */
interface EnabledVehiclesInterface extends DisabledVehiclesInterface
{
    activation_date: Date;
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
/**
 * Station configuration type.
 */
export type VehicleConfig = {
    lowSpeedLimit?: number; 
    mediumSpeedLimit?: number; 
    highSpeedLimit?: number; 
    cruiseControl?: boolean;
    buttonSwitchSpeedMode?: boolean;
};

/**
 * Enum for the vehicle alerts code.
 * @readonly
 * @enum {number}
 */
export enum VehicleAlertsCode {
    ILLEGAL_MOVING = 1,
    VEHICLE_DOWN= 2,
    ILLEGAL_DISMANTLING = 3,
    VEHICLE_WAS_LIFTED_UP = 4,
    // Other
    UNKNOWN_ALERT = 99, // Contact Knot Technical Support if you receive this alert code
}

/**
 * Enum for the vehicle fault status.
 * @readonly
 * @enum {string}
 */
export enum VehicleFaultStatus {
    APPEARING = 'appearing',
    DISAPPEARED = 'disappeared',
    UNKNOWN = 'unknown',  // Contact Knot Technical Support if you receive this fault status
}

/**
 * Enum for the vehicle faults code.
 * @readonly
 * @enum {number}
 */
export enum VehicleFaultsCode {
    // Global faults
    CONTROL_PANEL_AND_MAIN_CONTROL_COMMUNICATION = 100,
    ACCELERATOR_SENSOR = 101,
    LEFT_BRAKE_SENSOR = 102,
    RIGHT_BRAKE_SENSOR = 103,
    MOTOR_SENSOR = 104,
    PROGRAM_SKIP_ERROR = 105,
    IOT_AND_VEHICLE_COMMUNICATION_TIMEOUT = 106,
    VEHICLE_DEFAULT_SERIAL_NUMBER = 107,
    CHARGING_FAILURE = 108,
    BATTERY_TEMPERATURE_SENSOR = 109,
    CONTROLLER_TEMPERATURE_SENSOR = 110,
    OVER_MOTOR_TEMPERATURE = 111,
    CHECKING_BATTERY_AND_CONTROLLER_FAILED = 112,
    MAIN_CONTROLLER_AND_CONTROL_PANEL_DOES_NOT_MATCH = 113,
    MAIN_CONTROLLER_AND_BATTERY_COVER_LOCK_DOES_NOT_MATCH = 114,
    MAIN_CONTROLLER_AND_BATTERY_COVER_COMMUNICATION = 115,
    BATTERY_COVER_UNLOCKED = 116,
    // IoT faults
    ECU_COMMUNICATION = 200,
    BACKUP_BATTERY = 201,
    RTC_CLOCK = 202,
    FILE_SYSTEM = 203,
    I2C_COMMUNICATION = 204,
    GNSS_COMMUNICATION = 205,
    _4G_MODEM_COMMUNICATION = 206,
    BLUETOOTH_COMMUNICATION = 207,
    NFC_COMMUNICATION = 208,
    G_Sensor_communication = 209,
    // Motor faults
    MOTOR_CURRENT_A_PHASE = 300,
    MOTOR_CURRENT_B_PHASE = 301,
    MOTOR_CURRENT_C_PHASE = 302,
    // BMS faults
    BATTERY_VOLTAGE_DETECTION = 400,
    COMMUNICATION_BATTERY = 401,
    BATTERY_PASSWORD_IS_WRONG = 402,
    BATTERY_DEFAULT_SERIAL_NUMBER = 403,
    // ECU faults
    SYSTEM_VOLTAGE_DETECTION = 500,
    FLASH_SAVE_ERROR = 501,
    MASTER_CONTROL_PASSWORD_IS_WRONG = 502,
    // Other faults
    UNKNOWN_FAULT = 900, // Contact Knot Technical Support if you receive this fault code
}
