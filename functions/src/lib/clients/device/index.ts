import * as functions from "firebase-functions";

import elastic from '../../elastic';
import {
  SearchParams,
  SearchResponse,
  Device,
} from '../../../types';

const prefix = '[device client]';

class DeviceClient {
  /**
   * Search devices
   * @param params
   */
  async search(params: SearchParams): Promise<SearchResponse<Device>> {
    try {
      // filters
      const must: any[] = [];
      if (params.filters) {
        if (params.filters.user) {
          must.push({
            match_phrase: {
              'user_id.keyword': {
                query: params.filters.user,
              },
            },
          });
        }
      }

      // sort
      let sort: { [key: string]: { order: 'desc' | 'asc' } }[] = [
        { updated_at: { order: 'desc' } },
      ];
      if (params.sort) {
        sort = params.sort.map((s) => ({ [s.field]: { order: s.order } }));
      }

      const response = await elastic.search({
        index: 'devices-*',
        body: {
          query: {
            bool: {
              must,
            },
          },
          sort,
          from: params.from,
          size: params.size,
          _source: params.source,
        },
      });

      return {
        from: params.from,
        size: params.size,
        total: response.body.hits.total.value,
        hits: response.body.hits.hits.map(({ _source, _id, _index }: any) => ({
          ..._source,
          id: `${_index}|${_id}`,
        })),
      };
    } catch (error) {
      functions.logger.debug({ params });
      functions.logger.error(error);

      throw new Error(`${prefix} Unexpected error searching devices`);
    }
  }
}

export default new DeviceClient();
