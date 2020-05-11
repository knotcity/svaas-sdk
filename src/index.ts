import axios = require('axios');
import reqSigner = require('@knot/request-signer');

export enum EventType
{
    UNLOCKED = 'unlocked',
    LOCKED = 'locked',
    BOOT = 'boot',
    STATE = 'state',
    SHAKE = 'shake',
    HIGH_TEMP = 'high-temp',
    ENERGY_CRITICAL = 'critical-energy',
    UNEXPECTED_UNLOCK = 'unexpected-unlock',
    SPOT_DEFECT = 'spot-defect'
}

type EventBase = {
    event: EventType,
    station: number
}

export type UnlockedEvent = EventBase & {
    event: EventType.UNLOCKED,
    data: {
        spot: number,
        unlock: number
    }
};

export type LockedEvent = {
    event: EventType.LOCKED,
    data: {
        spot: number,
        vehicle: number,
        cache_accepted: boolean,
        time: number
    }
};

export type BootEvent = EventBase & {
    event: EventType.BOOT,
};

export type StateEvent = EventBase & {
    event: EventType.STATE,
    data: {
        mainboard: number,
        vehicles: number[]
    }
};

export type ShakeEvent = EventBase & {
    event: EventType.SHAKE,
};

export type HighTempEvent = EventBase & {
    event: EventType.HIGH_TEMP,
    data: {
        temperature: number,
        critical: boolean
    }
};

export type CriticalEnergyEvent = EventBase & {
    event: EventType.ENERGY_CRITICAL,
};

export type UnexpectedUnlockEvent = EventBase & {
    event: EventType.UNEXPECTED_UNLOCK,
    data: {
        spot: number
    }
};

export type SpotDefectEvents = EventBase & {
    event: EventType.SPOT_DEFECT,
    data: {
        spot: number,
        vehicle: number,
        vehicle_voltage: number,
        lock_status: number
    }
};

export type KnotEvent = UnlockedEvent | LockedEvent | BootEvent | StateEvent | ShakeEvent | HighTempEvent | CriticalEnergyEvent | UnexpectedUnlockEvent | SpotDefectEvents;

interface KnotSASOptions
{
    endpoint?: string;
    privateKey: string;
    keyId: string;
}

export class KnotSAS
{
    #options: KnotSASOptions;
    #ax: axios.AxiosInstance;

    constructor(options: KnotSASOptions)
    {
        if (typeof (options) !== 'object')
        {
            throwError("Options should be an object");
        }
        if (options.endpoint !== undefined)
        {
            if (typeof options.endpoint !== 'string')
            {
                throwError("The given endpoint should be a string");
            }
            if (options.endpoint.length < 3)
            {
                throwError("The given endpoint is too short to be valid");
            }
            if (options.endpoint.endsWith('/'))
            {
                options.endpoint = options.endpoint.substr(0, options.endpoint.length - 1);
            }
        }
        if (typeof options.keyId !== 'string')
        {
            throwError("The given keyId should be a string");
        }
        if (typeof options.privateKey !== 'string')
        {
            throwError("The given privateKey should be a string");
        }

        this.#options = options;
        this.#ax = axios.default.create({
            baseURL: this.#options.endpoint || 'https://staas.knotcity.io'
        });
        this.#ax.interceptors.request.use(c =>
        {
            c.headers['X-Knot-Date'] = +new Date();
            c.headers['X-Api-Key'] = this.#options.keyId;
            c.headers['Content-Type'] = 'application/json';
            c.headers['Content-Length'] = c.data ? JSON.stringify(c.data).length : 0;
            try
            {
                c.headers['Authorization'] = reqSigner.generateAuthorization({
                    headers: c.headers,
                    method: c.method || 'POST',
                    path: c.url || '/'
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

    rebootStation(id: number)
    {
        return this.makeStationRequest('v0.1', id, 'reboot');
    }

    pingStation(id: number)
    {
        return this.makeStationRequest('v0.1', id, 'ping');
    }

    unlockSpot(stationId: number, spotId: number, unlockId: number)
    {
        if (!Number.isInteger(spotId) || spotId < 1)
        {
            throwError('Spot ID should be an integer greater or equal to 1');
        }
        if (!Number.isInteger(unlockId) || unlockId < 0)
        {
            throwError('Unlock ID should be an integer greater or equal to 0');
        }
        return this.makeStationRequest('v0.1', stationId, 'unlock', {
            spot: spotId,
            unlock: unlockId
        });
    }

    scanAllStationSpot(id: number)
    {
        return this.makeStationRequest('v0.1', id, 'refresh');
    }

    confirmLockSpot(stationId: number, spotId: number)
    {
        return this.makeStationRequest('v0.1', stationId, 'lock-response', {
            spot: spotId
        });
    }

    private makeStationRequest(version: string, id: number, action: string, data?: any)
    {
        if (!Number.isInteger(id) || id < 1)
        {
            throwError('Station ID should be an integer greater or equal to 1');
        }
        return this.makeRequest(`/${version}/${id}/${action}`, data);
    }

    private async makeRequest(urn: string, data?: any)
    {
        const response = await this.#ax.post(`${urn}`, data, {
            validateStatus: (status) => status >= 200 && status < 500
        });
        console.log(response);
    }
}

function throwError(text: string)
{
    throw new Error(`[Knot SAS SDK] ${text}`);
}
