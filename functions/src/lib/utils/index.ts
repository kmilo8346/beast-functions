import get from "lodash.get";
import set from "lodash.set";

import elastic from "../elastic";
import { Item } from "../../types";

class Utils {
  public mapObject<T>(data: T, source: string[] | undefined): T {
    if (!source) return data;
    const s = [...source, "id"];

    const result: { [key: string]: any } = {};
    s.forEach((key) => {
      set(result, key, get(data, key));
    });
    return result as T;
  }

  public mapArray<T>(data: T[], source: string[] | undefined): T[] {
    if (!source) return data;

    return data.map((d) => this.mapObject<T>(d, source));
  }

  public getStats(items: Item[]) {
    return items.reduce(
      (stats, product) => ({
        total: stats.total + 1,
        ammount: stats.ammount + product.price * 1,
      }),
      {
        total: 0,
        ammount: 0,
      }
    );
  }

  public async createIndexIfNotExist(index: string, body: any) {
    const response = await elastic.indices.exists({ index });
    if (!response.body) {
      await elastic.indices.create({
        index,
        body,
      });
    }
  }

  public formatDate(date: string | number | Date) {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

  public parseId(id: string) {
    const parts = id.split("|");
    return parts.length > 1 ? parts[1] : id;
  }
}

export default new Utils();
