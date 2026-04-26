/**
 * HTTP Client
 * Base API client with interceptors
 * Pattern: Singleton + Adapter
 */

const BASE_URL =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? 'http://localhost:3001/api/v1' : '/api/v1');

/**
 * HTTP Error class
 */
export class HttpError extends Error {
  constructor(status, data) {
    // Priority: backend message > error.message > friendly status message > generic fallback
    let message = 'Yêu cầu thất bại';

    // Try to extract message from backend response
    if (data?.error?.message) {
      message = data.error.message;
    } else if (data?.message) {
      message = data.message;
    } else {
      // Provide friendly messages for common status codes
      switch (status) {
        case 400:
          message = 'Dữ liệu không hợp lệ';
          break;
        case 401:
          message = 'Email hoặc mật khẩu không đúng';
          break;
        case 403:
          message = 'Bạn không có quyền truy cập';
          break;
        case 404:
          message = 'Không tìm thấy dữ liệu';
          break;
        case 409:
          message = 'Dữ liệu đã tồn tại';
          break;
        case 500:
          message = 'Lỗi máy chủ, vui lòng thử lại sau';
          break;
        default:
          message = 'Yêu cầu thất bại';
      }
    }

    super(message);
    this.name = 'HttpError';
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

    const isFormData = body instanceof FormData || options.isFormData;
    const responseType = options.responseType || 'json';
    const hasBody = body !== null && body !== undefined;

    // Ensure correct Content-Type
    if (isFormData) {
      // Let browser set boundary
      if (config.headers && config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
    } else if (hasBody) {
      config.headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
    }

    if (hasBody) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(`${this.baseURL}${path}`, config);
    let data = null;

    try {
      if (responseType === 'blob') {
        data = await response.blob();
      } else if (responseType === 'text') {
        data = await response.text();
      } else {
        // default json
        data = await response.json();
      }
    } catch (err) {
      // ignore parse errors; data stays null
      data = null;
    }

    // Apply response interceptors
    for (const interceptor of this.interceptors.response) {
      await interceptor(response, data);
    }

    if (!response.ok) {
      // Với blob/text, thử chuyển lỗi về text để dễ đọc
      if (responseType === 'blob' && data instanceof Blob) {
        try {
          const text = await data.text();
          throw new HttpError(response.status, text ? { message: text } : null);
        } catch (e) {
          throw new HttpError(response.status, null);
        }
      }
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
