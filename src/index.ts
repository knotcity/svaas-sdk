import axios = require('axios');
import reqSigner = require('@knotcity/http-request-signer');
import { AuthorizationHeaderComponents, parseAuthorizationHeader, verifyAuthorization } from '@knotcity/http-request-signer';

import type { BadgeReaderStatus, ConfirmLockAnswer } from './station';
import type { DisabledVehicles, EnabledVehicles, KnotVehicleEvent, VehicleInformation } from './vehicle';
import type {
    DisabledStations,
    EnabledStations,
    KnotStationEvent,
    StationConfigType,
    StationInformation
} from './station';

export type KnotEvent = KnotStationEvent | KnotVehicleEvent;

export type RequestResults<T = undefined> = {
    code: number;
    message: string;
    data: T
}

interface KnotSaaSOptions
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

export class KnotSaaS
{
    #options: KnotSaaSOptions;
    #ax: axios.AxiosInstance;

    constructor(options: KnotSaaSOptions)
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
        this.#ax = axios.default.create({ validateStatus: status => status === 200 });
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

    configureStation(stationId: number, type: StationConfigType, value: number): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'config', stationId, {
            config: type,
            value
        });
    }

    unlockSpot(stationId: number, spotId: number, unlockId: number, ignoreVehicleResponse?: boolean): Promise<RequestResults>
    {
        if (!Number.isInteger(spotId) || spotId < 1)
        {
            throwError('Spot ID should be an integer greater or equal to 1');
        }
        if (!Number.isInteger(unlockId) || unlockId < 1)
        {
            throwError('Unlock ID should be an integer greater or equal to 1');
        }
        if (ignoreVehicleResponse !== undefined && typeof ignoreVehicleResponse !== 'boolean')
        {
            throwError('Ignore vehicle response should be a boolean or undefined');
        }
        return this.makeStationRequest('POST', 'v1', 'unlock', stationId, {
            spot: spotId,
            unlock: unlockId,
            ignore_vehicle_response: ignoreVehicleResponse
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
        if (requestResults.data && requestResults.data.activation_date)
        {
            requestResults.data.activation_date = new Date(requestResults.data.activation_date);
        }
        return requestResults;
    }

    async getEnabledStations(): Promise<EnabledStations>
    {
        const requestResults = await this.makeStationRequest('GET', 'v1', 'enabled');
        requestResults.data.forEach((r: any) => {
            r.activation_date = new Date(r.data.activation_date);
            return r;
        });
        return requestResults;
    }

    async getDisabledStations(): Promise<DisabledStations>
    {
        return await this.makeStationRequest('GET', 'v1', 'disabled');
    }
    //#endregion Station commands

    //#region Vehicle commands
    unlockVehicle(vehicleId: number, unlockId: number): Promise<RequestResults>
    {
        if (!Number.isInteger(unlockId) || unlockId < 1)
        {
            throwError('Unlock ID should be an integer greater or equal to 1');
        }
        return this.makeVehicleRequest('POST', 'v1', 'unlock', vehicleId, {
            unlock: unlockId
        });
    }

    lockVehicle(vehicleId: number, lockId: number): Promise<RequestResults>
    {
        if (!Number.isInteger(lockId) || lockId < 1)
        {
            throwError('Lock ID should be an integer greater or equal to 1');
        }
        return this.makeVehicleRequest('POST', 'v1', 'lock', vehicleId, {
            lock: lockId
        });
    }

    emitVehicleSound(vehicleId: number, soundType: 'geo-fence' | 'toot' | 'low_battery'): Promise<RequestResults>
    {
        if (soundType != 'geo-fence' && soundType !=  'toot' && soundType !=  'low_battery')
        {
            throwError('Sound type should be an string equal to \'geo-fence\', \'toot\' or \'low_battery\'');
        }
        return this.makeVehicleRequest('POST', 'v1', 'sound', vehicleId, {
            sound_type: soundType
        });
    }

    openVehicleBatteryCover(vehicleId: number)
    {
        return this.makeVehicleRequest('POST', 'v1', 'battery-cover', vehicleId);
    }

    enableVehicle(vehicleId: number): Promise<RequestResults>
    {
        return this.makeVehicleRequest('POST', 'v1', 'enable', vehicleId);
    }

    shutdownVehicle(vehicleId: number)
    {
        return this.makeVehicleRequest('POST', 'v1', 'shutdown', vehicleId);
    }

    async getVehicleInformation(vehicleId: number): Promise<VehicleInformation>
    {
        const requestResults = await this.makeVehicleRequest('GET', 'v1', '', vehicleId);
        if (requestResults.data.activation_date)
        {
            requestResults.data.activation_date = new Date(requestResults.data.activation_date);
        }
        return requestResults;
    }

    async getEnabledVehicles(): Promise<EnabledVehicles>
    {
        const requestResults = await this.makeVehicleRequest('GET', 'v1', 'enabled');
        requestResults.data.forEach((r: any) => {
            r.activation_date = new Date(r.data.activation_date);
            return r;
        });
        return requestResults;
    }

    async getDisabledVehicles(): Promise<DisabledVehicles>
    {
        return await this.makeVehicleRequest('GET', 'v1', 'disabled');
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

    private makeVehicleRequest(method: axios.Method, version: string, action: string, id?: number, data?: any)
    {
        let path: string;
        if (id)
        {
            if (!Number.isInteger(id) || id < 1)
            {
                throwError('Vehicle ID should be an integer greater or equal to 1');
            }
            path = `/${version}/${id}/${action}`;
        }
        else
        {
            path = `/${version}/${action}`;
        }
        return this.makeRequest(method, `${this.#options.vehiclesEndpoint || 'https://vaas.knotcity.io'}${path}`, data);
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
    throw new Error(`[Knot SaaS SDK] ${text}`);
}
