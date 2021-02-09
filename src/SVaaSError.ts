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
