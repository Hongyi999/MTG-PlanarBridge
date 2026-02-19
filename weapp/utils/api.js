/**
 * API utility for WeChat Mini Program
 * Wraps wx.request with the backend base URL, error handling, and loading states.
 */

const app = getApp();

/**
 * Make an HTTP request to the backend API
 * @param {string} url - API path (e.g., '/api/cards/search')
 * @param {string} method - HTTP method
 * @param {object} data - Request data (query params for GET, body for POST)
 * @param {object} options - Additional options
 * @returns {Promise}
 */
function request(url, method, data, options = {}) {
  return new Promise((resolve, reject) => {
    const baseUrl = app.globalData.apiBaseUrl;
    const header = {
      'Content-Type': 'application/json'
    };

    // Include session cookie if available
    const sessionId = app.globalData.sessionId;
    if (sessionId) {
      header['Cookie'] = `connect.sid=${sessionId}`;
    }

    if (options.showLoading) {
      wx.showLoading({ title: 'Loading...' });
    }

    wx.request({
      url: `${baseUrl}${url}`,
      method: method,
      data: data,
      header: header,
      success(res) {
        if (options.showLoading) {
          wx.hideLoading();
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Extract session ID from Set-Cookie header
          const cookies = res.header['Set-Cookie'] || res.header['set-cookie'];
          if (cookies) {
            const match = cookies.match(/connect\.sid=([^;]+)/);
            if (match) {
              app.globalData.sessionId = match[1];
              wx.setStorageSync('sessionId', match[1]);
            }
          }
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // Not authenticated
          reject({ code: 401, message: 'Please log in first' });
        } else {
          const message = (res.data && res.data.message) || `Request failed (${res.statusCode})`;
          reject({ code: res.statusCode, message: message });
        }
      },
      fail(err) {
        if (options.showLoading) {
          wx.hideLoading();
        }
        console.error('[API] Request failed:', url, err);
        reject({ code: -1, message: 'Network error. Please check your connection.' });
      }
    });
  });
}

module.exports = {
  get: function(url, data, options) {
    return request(url, 'GET', data, options);
  },
  post: function(url, data, options) {
    return request(url, 'POST', data, options);
  },
  put: function(url, data, options) {
    return request(url, 'PUT', data, options);
  },
  patch: function(url, data, options) {
    return request(url, 'PATCH', data, options);
  },
  del: function(url, data, options) {
    return request(url, 'DELETE', data, options);
  },

  /**
   * Upload image file
   * @param {string} filePath - Local temp file path from wx.chooseImage
   * @returns {Promise<string>} - Uploaded file URL
   */
  uploadImage: function(filePath) {
    return new Promise((resolve, reject) => {
      const baseUrl = app.globalData.apiBaseUrl;
      wx.uploadFile({
        url: `${baseUrl}/api/upload`,
        filePath: filePath,
        name: 'images',
        success(res) {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data);
            resolve(data.urls ? data.urls[0] : data.url);
          } else {
            reject({ message: 'Upload failed' });
          }
        },
        fail(err) {
          reject(err);
        }
      });
    });
  }
};
