import elastic from "../elastic";

export default {
  formatDate: (date: string) => {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    let year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  },
  createIndexIfNotExist: async (index: string, body: any) => {
    const response = await elastic.indices.exists({ index });
    if (!response.body) {
      await elastic.indices.create({
        index,
        body,
      });
    }
  },
  getStats: (products: any[]) => {
    return products.reduce(
      (stats, product) => ({
        total: stats.total + 1,
        ammount: stats.ammount + product.price * 1,
      }),
      {
        total: 0,
        ammount: 0,
      },
    );
  }
};
