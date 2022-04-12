/**
 * class encapsulating Knot errors.
 */
export class SVaaSError extends Error
{
    /**
     * Class constructor
     * @param {string} message - Error description.
     */
    constructor(message: string) {
        super(`[Knot SVaaS SDK] ${message}`);
    }
}

/**
 * class encapsulating Knot requests errors.
 */
export class SVaaSRequestError extends SVaaSError
{
    /**
     * Class constructor
     * @param {string} message - Error description.
     * @param {string} url -
     * @param {any} data -
     */
    constructor(message: string, url: string, data: any) {
        super(`${message}: ${url} ${data}`);
    }
}
