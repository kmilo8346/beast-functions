import * as functions from 'firebase-functions';

const get = (obj: any, path: string): any => {
  let result: any = obj;
  for (let i = 0, p = path.split('.'), len = p.length; i < len; i++){
    result = result[p[i]];
  };
  return result;
};

/**
 * Configuration Client for ensure consistency
 * @class ConfigurationClient
 */
class ConfigurationClient {
  /**
   * Get config by key as string
   * @param {String} key Config key
   * @param {String} defaultValue Default value if not set
   * @memberof ConfigurationClient
   * @returns {String} return string value
   */
  get(key: string, defaultValue?: any): string {
    const value = get(functions.config().env, key);
    if (typeof value === 'undefined' && typeof defaultValue === 'undefined') {
      throw new Error(`Environment value ${key} is undefined`);
    }
    return value || defaultValue;
  }

  /**
   * Get config by key as boolean
   * @param {String} key Config key
   * @param {Boolean} defaultValue Default value if not set
   * @memberof ConfigurationClient
   * @returns {Boolean} returns the boolean value
   */
  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue);
    if (typeof value === 'boolean') {
      return value;
    }
    return value === 'true' || value === '1';
  }

  /**
   * Get config by key as number
   * @param {String} key Config key
   * @param {Number} defaultValue Default value if not set
   * @memberof ConfigurationClient
   * @returns {Number} return the number value
   */
  getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue);
    if (typeof value === 'number') {
      return value;
    }
    return parseInt(value, 10);
  }

  /**
   * Check if a setting name exist in the configuration
   * @param {String} key Setting Name to check
   * @returns {Boolean} existence
   */
  exists(key: string): boolean {
    return this.get(key, null) !== null;
  }
}

export default new ConfigurationClient();
