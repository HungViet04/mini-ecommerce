/**
 * HTTP Client
 * Base API client with interceptors
 * Pattern: Singleton + Adapter
 */

const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/v1';

/**
 * HTTP Error class
 */
export class HttpError extends Error {
  constructor(status, data) {
    super(data?.message || data?.error?.message || 'Yêu cầu thất bại');
    this.status = status;
    this.data = data;
  }
}

/**
 * Create HTTP client instance
 */
class HttpClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.interceptors = {
      request: [],
      response: [],
    };
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(fn) {
    this.interceptors.request.push(fn);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(fn) {
    this.interceptors.response.push(fn);
  }

  /**
   * Build request config
   */
  async buildConfig(method, options = {}) {
    let config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Apply request interceptors
    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }

    return config;
  }

  /**
   * Make HTTP request
   */
  async request(method, path, body = null, options = {}) {
    const config = await this.buildConfig(method, options);

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseURL}${path}`, config);
    const data = await response.json().catch(() => null);

    // Apply response interceptors
    for (const interceptor of this.interceptors.response) {
      await interceptor(response, data);
    }

    if (!response.ok) {
      throw new HttpError(response.status, data);
    }

    return data;
  }

  // Convenience methods
  get(path, options) {
    return this.request('GET', path, null, options);
  }

  post(path, body, options) {
    return this.request('POST', path, body, options);
  }

  put(path, body, options) {
    return this.request('PUT', path, body, options);
  }

  patch(path, body, options) {
    return this.request('PATCH', path, body, options);
  }

  delete(path, options) {
    return this.request('DELETE', path, null, options);
  }
}

// Create singleton instance
const httpClient = new HttpClient(BASE_URL);

export default httpClient;
