import axios from 'axios';
import { monitoringService } from './monitoringService';

const MAX_RETRIES = 3;
const TIMEOUT = 10000;

class ResilientApiClient {
    constructor(baseURL) {
        this.client = axios.create({
            baseURL,
            timeout: TIMEOUT
        });

        // Circuit Breaker State
        this.failureCount = 0;
        this.isCircuitOpen = false;
        this.lastFailureTime = 0;
        this.resetTimeout = 30000; // 30s cooldwon
    }

    async get(endpoint, config = {}) {
        return this.request('get', endpoint, null, config);
    }

    async post(endpoint, data, config = {}) {
        return this.request('post', endpoint, data, config);
    }

    async request(method, endpoint, data, config) {
        if (this.isCircuitOpen) {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.isCircuitOpen = false; // Half-open / Retry
            } else {
                throw new Error("Service unavailable (Circuit Open)");
            }
        }

        let attempts = 0;
        const startTime = Date.now();

        while (attempts < MAX_RETRIES) {
            try {
                const response = await this.client.request({
                    method,
                    url: endpoint,
                    data,
                    ...config
                });

                // Success
                this.failureCount = 0;
                monitoringService.trackApiCall(endpoint, Date.now() - startTime, true);
                return response.data;
            } catch (error) {
                attempts++;

                // Check if we should retry (Network or 5xx)
                const isRetryable = !error.response || (error.response.status >= 500 && error.response.status !== 501);

                if (isRetryable && attempts < MAX_RETRIES) {
                    const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
                    console.warn(`Attempt ${attempts} failed for ${endpoint}. Retrying in ${delay}ms...`);
                    await new Promise(r => setTimeout(r, delay));
                    continue; // Loop again
                }

                // Failure
                this.failureCount++;
                if (this.failureCount >= 5) {
                    this.isCircuitOpen = true;
                    this.lastFailureTime = Date.now();
                    monitoringService.logError(new Error(`Circuit Breaker Opened for ${endpoint}`), 'api', 'critical');
                }

                monitoringService.trackApiCall(endpoint, Date.now() - startTime, false);
                monitoringService.logError(error, `API ${method.toUpperCase()} ${endpoint}`, 'error');
                throw error;
            }
        }
    }
}

// Export specialised instances
export const monCashClient = new ResilientApiClient('https://moncashbutton.digicelgroup.com/Api'); // Mock URL
export const appApiClient = new ResilientApiClient('/api');
