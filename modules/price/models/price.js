// 商品价格表
module.exports = (sequelize, DataTypes) => {
  const ProductPrice = sequelize.define('ProductPrice', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: DataTypes.INTEGER,
    platform: DataTypes.STRING,
    price: DataTypes.DECIMAL(10,2),
    date: DataTypes.DATE
  }, { tableName: 'product_prices', timestamps: false });
  return ProductPrice;
};
