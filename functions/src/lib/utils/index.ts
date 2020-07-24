import elastic from "../elastic";

export default {
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
