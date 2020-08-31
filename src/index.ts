import axios = require('axios');
import reqSigner = require('@knotcity/http-request-signer');
import { AuthorizationHeaderComponents, parseAuthorizationHeader, verifyAuthorization } from '@knotcity/http-request-signer';

//#region Station events
export enum EventStationType
{
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

export type KnotStationEvent = UnlockedStationEvent | LockedStationEvent | BootStationEvent | StateStationEvent | ShakeStationEvent | HighTempStationEvent | CriticalEnergyStationEvent | UnexpectedUnlockStationEvent | SpotDefectStationEvent | BadgeRFIDStationEvent;
//#endregion Station events

//#region Vehicle events
export enum EventVehicleType
{
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    UNLOCKED = 'unlocked',
    LOCKED = 'locked',
    LOCATION = 'location',
    STATUS = 'status'
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
        unlock: number
    }
};

export type LockedVehicleEvent = EventVehicleBase & {
    event: EventVehicleType.LOCKED,
    data: {
        lock: number
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

export type KnotVehicleEvent = UnlockedVehicleEvent | LockedVehicleEvent | LocationVehicleEvent | StatusVehicleEvent;
//#endregion Vehicle events

export type KnotEvent = KnotStationEvent | KnotVehicleEvent;

export type RequestResults<T = undefined> = {
    code: number;
    message: string;
    data: T
}

interface KnotSASOptions
{
    stationsEndpoint?: string;
    vehiclesEndpoint?: string;
    privateKey: string;
    knotPublicKey: string;
    keyId: string;
}

interface SignatureRequest
{
    headers: { [key: string]: any },
    httpMethod: string,
    path: string
}

export type StationInformation = RequestResults<{ spots_count: number, model_name: string, activation_date: Date | null, station_id: number, model_type: string, manufacturer: string }>;
export type EnabledStations = RequestResults<{ station_id: number, spots_count: number, activation_date: Date }[]>;
export type DisabledStations = RequestResults<{ station_id: number, spots_count: number }[]>;

export class KnotSAS
{
    #options: KnotSASOptions;
    #ax: axios.AxiosInstance;

    constructor(options: KnotSASOptions)
    {
        if (typeof (options) !== 'object')
        {
            throwError('Options should be an object');
        }
        if (options.stationsEndpoint !== undefined)
        {
            if (typeof options.stationsEndpoint !== 'string')
            {
                throwError('The given stations endpoint should be a string');
            }
            if (options.stationsEndpoint.length < 3)
            {
                throwError('The given stations endpoint is too short to be valid');
            }
            if (options.stationsEndpoint.endsWith('/'))
            {
                options.stationsEndpoint = options.stationsEndpoint.substr(0, options.stationsEndpoint.length - 1);
            }
        }
        if (options.vehiclesEndpoint !== undefined)
        {
            if (typeof options.vehiclesEndpoint !== 'string')
            {
                throwError('The given vehicles endpoint should be a string');
            }
            if (options.vehiclesEndpoint.length < 3)
            {
                throwError('The given vehicles endpoint is too short to be valid');
            }
            if (options.vehiclesEndpoint.endsWith('/'))
            {
                options.vehiclesEndpoint = options.vehiclesEndpoint.substr(0, options.vehiclesEndpoint.length - 1);
            }
        }
        if (typeof options.keyId !== 'string')
        {
            throwError('The given keyId should be a string');
        }
        if (typeof options.privateKey !== 'string')
        {
            throwError('The given privateKey should be a string');
        }

        this.#options = options;
        this.#ax = axios.default.create();
        this.#ax.interceptors.request.use(c =>
        {
            c.headers['X-Knot-Date'] = +new Date();
            c.headers['X-Api-Key'] = this.#options.keyId;
            c.headers['Content-Type'] = 'application/json';
            c.headers['Content-Length'] = c.data ? JSON.stringify(c.data).length : 0;
            try
            {
                const url =  c.url ? new URL(c.url) : undefined;
                c.headers['Authorization'] = reqSigner.generateAuthorization({
                    headers: c.headers,
                    method: c.method || 'POST',
                    path: url?.href.split(url.origin)[1] || '/'
                }, {
                    algorithm: 'ecdsa',
                    hash: 'sha256',
                    headers: ['X-Knot-Date', '(request-target)', 'Content-Type', 'Content-Length'],
                    keyId: this.#options.keyId,
                    privateKey: this.#options.privateKey
                });
            }
            catch (err)
            {
                throwError(`Generating the request signature failed: ${err.toString()}`);
            }
            return c;
        });
    }

    //#region Station commands
    rebootStation(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'reboot', stationId);
    }

    pingStation(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'ping', stationId);
    }

    unlockSpot(stationId: number, spotId: number, unlockId: number): Promise<RequestResults>
    {
        if (!Number.isInteger(spotId) || spotId < 1)
        {
            throwError('Spot ID should be an integer greater or equal to 1');
        }
        if (!Number.isInteger(unlockId) || unlockId < 0)
        {
            throwError('Unlock ID should be an integer greater or equal to 0');
        }
        return this.makeStationRequest('POST', 'v1', 'unlock', stationId, {
            spot: spotId,
            unlock: unlockId
        });
    }

    scanAllStationSpot(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'refresh', stationId);
    }

    confirmLockSpot(stationId: number, spotId: number, accepted: ConfirmLockAnswer): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'lock-response', stationId, {
            spot: spotId,
            accepted
        });
    }

    badgeReaderFeedback(stationId: number, status: BadgeReaderStatus): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'badge', stationId, {
            status
        });
    }

    enableStation(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'enable', stationId);
    }

    async getStationInformation(stationId: number): Promise<StationInformation>
    {
        const requestResults = await this.makeStationRequest('GET', 'v1', '', stationId);
        if (requestResults.data.activation_date)
        {
            requestResults.data.activation_date = new Date(requestResults.data.activation_date);
        }
        return requestResults;
    }

    async getEnabledStations(): Promise<EnabledStations>
    {
        const requestResults = await this.makeStationRequest('GET', 'v1', 'enabled');
        return requestResults.data.map((r: any) => {
            r.activation_date = new Date(r.data.activation_date);
            return r;
        });
    }

    async getDisabledStations(): Promise<DisabledStations>
    {
        return await this.makeStationRequest('GET', 'v1', 'disabled');
    }
    //#endregion Station commands

    //#region Vehicle commands
    unlockVehicle(vehicleId: number, unlockId: number): Promise<RequestResults>
    {
        if (!Number.isInteger(unlockId) || unlockId < 0)
        {
            throwError('Unlock ID should be an integer greater or equal to 0');
        }
        return this.makeVehicleRequest('POST', 'v1', vehicleId, 'unlock', {
            unlock: unlockId
        });
    }

    lockVehicle(vehicleId: number, lockId: number): Promise<RequestResults>
    {
        if (!Number.isInteger(lockId) || lockId < 0)
        {
            throwError('Lock ID should be an integer greater or equal to 0');
        }
        return this.makeVehicleRequest('POST', 'v1', vehicleId, 'lock', {
            lock: lockId
        });
    }

    emitVehicleSound(vehicleId: number, soundType: 'geo-fence' | 'toot' | 'low_battery'): Promise<RequestResults>
    {
        if (soundType != 'geo-fence' && soundType !=  'toot' && soundType !=  'low_battery')
        {
            throwError('Sound type should be an string equal to \'geo-fence\', \'toot\' or \'low_battery\'');
        }
        return this.makeVehicleRequest('POST', 'v1', vehicleId, 'sound', {
            sound_type: soundType
        });
    }

    openVehicleBatteryCover(vehicleId: number)
    {
        return this.makeVehicleRequest('POST', 'v1', vehicleId, 'battery-cover');
    }

    enableVehicle(vehicleId: number): Promise<RequestResults>
    {
        return this.makeVehicleRequest('POST', 'v1', vehicleId, 'enable');
    }
    //#endregion Vehicle commands

    // Signature validation
    checkKnotRequestSignature(request: SignatureRequest)
    {
        try
        {
            const headers = Object.entries(request.headers);
            const authHeader = headers.find(e => e[0].toLocaleLowerCase() == 'authorization');
            if (!authHeader || typeof authHeader[1] !== 'string')
            {
                return false;
            }

            const authComponents = parseAuthorizationHeader(authHeader[1]);
            if (!authComponents.headers.includes('x-knot-date') || !authComponents.headers.includes('(request-target)'))
            {
                return false;
            }

            const compts: AuthorizationHeaderComponents = authComponents.algorithm && authComponents.hash ?
                (authComponents as AuthorizationHeaderComponents) :
                Object.assign(authComponents, { hash: 'sha256', algorithm: 'ecdsa' });

            return verifyAuthorization(compts, {
                headers: request.headers,
                method: request.httpMethod,
                path: request.path
            }, this.#options.knotPublicKey);
        }
        catch (e)
        {
            return false;
        }
    }

    async getVehicleInformation(vehicleId: number): Promise<StationInformation>
    {
        const requestResults = await this.makeVehicleRequest('GET', 'v1', vehicleId, '');
        if (requestResults.data.activation_date)
        {
            requestResults.data.activation_date = new Date(requestResults.data.activation_date);
        }
        return requestResults;
    }

    private makeStationRequest(method: axios.Method, version: string, action: string, id?: number, data?: any)
    {
        let path: string;
        if (id)
        {
            if (!Number.isInteger(id) || id < 1)
            {
                throwError('Station ID should be an integer greater or equal to 1');
            }
            path = `/${version}/${id}/${action}`;
        }
        else
        {
            path = `/${version}/${action}`;
        }

        return this.makeRequest(method, `${this.#options.stationsEndpoint || 'https://staas.knotcity.io'}${path}`, data);
    }

    private makeVehicleRequest(method: axios.Method, version: string, id: number, action: string, data?: any)
    {
        if (!Number.isInteger(id) || id < 1)
        {
            throwError('Vehicle ID should be an integer greater or equal to 1');
        }
        return this.makeRequest(method, `${this.#options.vehiclesEndpoint || 'https://vaas.knotcity.io'}/${version}/${id}/${action}`, data);
    }

    private async makeRequest(method: axios.Method, url: string, data?: any)
    {
        const results = await this.#ax({
            method,
            data,
            url,
            validateStatus: (status) => status >= 200 && status < 500
        });
        return results.data as RequestResults<any>;
    }
}

function throwError(text: string)
{
    throw new Error(`[Knot SAS SDK] ${text}`);
}
