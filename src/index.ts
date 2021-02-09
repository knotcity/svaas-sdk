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

/**
 * Interface for SVaaS option used in the KnotSVaaS class constructor.
 * @interface
 */
interface KnotSVaaSOptions
{
    stationsEndpoint?: string;
    vehiclesEndpoint?: string;
    privateKey: string;
    knotPublicKey: string;
    keyId: string;
}

/**
 * Interface for the event for check the signature.
 * @interface
 */
interface SignatureEvent
{
    headers: { [key: string]: any },
    httpMethod: string,
    path: string
}

/**
 * Knot Stations and Vehicles as a Service utility class.
 */
export class KnotSVaaS
{
    #options: KnotSVaaSOptions;
    #ax: axios.AxiosInstance;

    /**
     * Class constructor.
     * @param {KnotSVaaSOptions} options - Information for the SVaaS connection (keys and endpoints).
     */
    constructor(options: KnotSVaaSOptions)
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
    /**
     * Send request to reboot the station.
     * @param {number} stationId - The identifier of the station.
     */
    rebootStation(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'reboot', stationId);
    }

    /**
     * Send request to ping the station.
     * @param {number} stationId - The identifier of the station.
     */
    pingStation(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'ping', stationId);
    }

    /**
     * Send request to change station configuration.
     * @param {number} stationId - The identifier of the station.
     * @param {StationConfigType} type - The name of the configuration to edit.
     * @param {number} value - The value of the configuration.
     */
    configureStation(stationId: number, type: StationConfigType, value: number): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'config', stationId, {
            config: type,
            value
        });
    }

    /**
     * Send request to unlock a station spot.
     * @param {number} stationId - The identifier of the station.
     * @param {number} spotId - The identifier of the spot to unlock.
     * @param {number} unlockId - An identifier to track this unlock request. This will be sent back in the unlocked event.
     * @param {boolean} ignoreVehicleResponse - Ignore the vehicle unlock response if there is vehicle with IoT on the spot. Useful for maintenance as it allow to unlock a spot with a broken or unavailable vehicle.
     */
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

    /**
     * Send request to scan of all spots of a station. For each spot with a vehicle in, the station will re-send the locked event.
     * @param {number} stationId - The identifier of the station.
     */
    scanAllStationSpot(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'refresh', stationId);
    }

    /**
     * Send a response to confirm the locking of the station.
     * @param {number} stationId - The identifier of the station.
     * @param {number} spotId - The identifier of the spot to which to send the lock response.
     * @param {ConfirmLockAnswer} accepted - Response status of the vehicle's lock on the station.
     */
    confirmLockSpot(stationId: number, spotId: number, accepted: ConfirmLockAnswer): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'lock-response', stationId, {
            spot: spotId,
            accepted
        });
    }

    /**
     * Send a feedback to the user for the card reader.
     * @param {number} stationId - The identifier of the station.
     * @param {BadgeReaderStatus} status - Status of the feedback send to the user.
     */
    badgeReaderFeedback(stationId: number, status: BadgeReaderStatus): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'badge', stationId, {
            status
        });
    }

    /**
     * Send request for enable the station.
     * @param {number} stationId - The identifier of the station.
     */
    enableStation(stationId: number): Promise<RequestResults>
    {
        return this.makeStationRequest('POST', 'v1', 'enable', stationId);
    }

    /**
     * Get the station's information and current state.
     * @param {number} stationId - The identifier of the station.
     */
    async getStationInformation(stationId: number): Promise<StationInformation>
    {
        const requestResults = await this.makeStationRequest('GET', 'v1', '', stationId);
        if (requestResults.data && requestResults.data.activation_date)
        {
            requestResults.data.activation_date = new Date(requestResults.data.activation_date);
        }
        return requestResults;
    }

    /**
     * Get the list of enabled stations.
     */
    async getEnabledStations(): Promise<EnabledStations>
    {
        const requestResults = await this.makeStationRequest('GET', 'v1', 'enabled');
        requestResults.data.forEach((r: any) => {
            r.activation_date = new Date(r.data.activation_date);
            return r;
        });
        return requestResults;
    }

    /**
     * Get the list of disabled stations.
     */
    async getDisabledStations(): Promise<DisabledStations>
    {
        return await this.makeStationRequest('GET', 'v1', 'disabled');
    }
    //#endregion Station commands

    //#region Vehicle commands
    /**
     * Send request to unlock a vehicle.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @param {number} unlockId - An identifier to track this unlock request. This will be sent back in the unlocked event.
     */
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

    /**
     * Send request to lock a vehicle.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @param {number} lockId - An identifier to track this lock request. This will be sent back in the locked event.
     */
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

    /**
     * Send request to the vehicle for play a sound.
     * @param {number} vehicleId - The identifier of the vehicle.
     * @param {('geo-fence'|'toot'|'low_battery')} soundType - The name of the sound to play.
     */
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

    /**
     * Send request to open the battery cover of the vehicle.
     * @param {number} vehicleId - The identifier of the vehicle.
     */
    openVehicleBatteryCover(vehicleId: number)
    {
        return this.makeVehicleRequest('POST', 'v1', 'battery-cover', vehicleId);
    }

    /**
     * Send request for enable the vehicle.
     * @param {number} vehicleId - The identifier of the vehicle.
     */
    enableVehicle(vehicleId: number): Promise<RequestResults>
    {
        return this.makeVehicleRequest('POST', 'v1', 'enable', vehicleId);
    }

    /**
     * Send request for shutdown the vehicle (ex: for the transport).
     * @param {number} vehicleId - The identifier of the vehicle.
     */
    shutdownVehicle(vehicleId: number)
    {
        return this.makeVehicleRequest('POST', 'v1', 'shutdown', vehicleId);
    }

    /**
     * Get the vehicle's information.
     * @param {number} vehicleId - The identifier of the vehicle.
     */
    async getVehicleInformation(vehicleId: number): Promise<VehicleInformation>
    {
        const requestResults = await this.makeVehicleRequest('GET', 'v1', '', vehicleId);
        if (requestResults.data.activation_date)
        {
            requestResults.data.activation_date = new Date(requestResults.data.activation_date);
        }
        return requestResults;
    }

    /**
     * Get the list of enabled vehicles.
     */
    async getEnabledVehicles(): Promise<EnabledVehicles>
    {
        const requestResults = await this.makeVehicleRequest('GET', 'v1', 'enabled');
        requestResults.data.forEach((r: any) => {
            r.activation_date = new Date(r.data.activation_date);
            return r;
        });
        return requestResults;
    }

    /**
     * Get the list of disabled vehicles.
     */
    async getDisabledVehicles(): Promise<DisabledVehicles>
    {
        return await this.makeVehicleRequest('GET', 'v1', 'disabled');
    }
    //#endregion Vehicle commands

    // Signature validation
    /**
     * Check the signature event signature.
     * @param {SignatureEvent} event - Event information.
     */
    checkKnotEventSignature(event: SignatureEvent)
    {
        try
        {
            const headers = Object.entries(event.headers);
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
                headers: event.headers,
                method: event.httpMethod,
                path: event.path
            }, this.#options.knotPublicKey);
        }
        catch (e)
        {
            return false;
        }
    }

    /**
     * Make a station request for the SVaaS API.
     * @param {axios.Method} method - HTTP method used for make the request.
     * @param {string} version - Version of the service to call.
     * @param {string} action - Action to call.
     * @param {number} [id] - The identifier of the station if necessary.
     * @param {*} [data] - Other data.
     * @private
     */
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

    /**
     * Make a vehicle request for the SVaaS API.
     * @param {axios.Method} method - HTTP method used for make the request.
     * @param {string} version - Version of the service to call.
     * @param {string} action - Action to call.
     * @param {number} [id] - The identifier of the vehicle if necessary.
     * @param {*} [data] - Other data.
     * @private
     */
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

    /**
     * Make and send the final request.
     * @param {axios.Method} method - HTTP method used for make the request.
     * @param {string} url - SVaaS url to called.
     * @param {*} [data] - Other data.
     * @private
     */
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

/**
 * Throw an SVaaS error.
 * @param {string} text - Error information.
 */
function throwError(text: string)
{
    throw new Error(`[Knot SVaaS SDK] ${text}`);
}
