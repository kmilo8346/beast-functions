import * as functions from "firebase-functions";

import utils from "../../utils";
import elastic from "../../elastic";
import { Store } from "../../../types";

const index = "stores";
const prefix = "[store client]";

/**
 * @class StoreClient
 */
class StoreClient {
  /**
   * Get store
   * @param id string
   * @param source string[]
   * @returns Promise<Store>
   */
  public async get(id: string, source?: string[]): Promise<Store> {
    try {
      const response = await elastic.get({
        index,
        id: utils.parseId(id),
        _source: source,
      });
      return {
        ...response.body._source,
        id: response.body._id,
      };
    } catch (error) {
      functions.logger.debug({ id, source });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error getting store`);
    }
  }
}

export default new StoreClient();
