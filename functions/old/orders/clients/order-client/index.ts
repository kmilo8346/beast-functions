import * as functions from "firebase-functions";

import elastic from "../../../../lib/elastic";

const prefix = "[order client]";

class OrderClient {
  /**
   * Get a order
   * @param id
   * @param index
   * @returns Promise<Order>
   */
  public async get(id: string, index: string,) {
    try {
      const response = await elastic.get({
        id,
        index,
      });
      
      return {
        ...response.body._source,
        id: response.body._id,
        index: response.body._index,
      };
    } catch (error) {
      functions.logger.debug({ index, id });
      functions.logger.error(error);
      throw new Error(`${prefix} Unexpected error getting order`);
    }
  }

  /**
   * Updating order
   * @param id 
   * @param index 
   * @param data 
   * @returns Promise<Order>
   */
  public async update(id: string, index: string, data: any) {
    try {
      await elastic.update({
        index,
        id,
        body: {
          doc: data,
        },
      });
    } catch (error) {
      functions.logger.debug({ index, id, data,});
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error updating order`);
    }
  }
}

export default new OrderClient();
