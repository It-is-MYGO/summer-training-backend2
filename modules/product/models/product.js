// 商品数据模型定义（以sequelize为例）
const sequelize = require('sequelize');
const ProductSchema = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: DataTypes.STRING,
    desc: DataTypes.STRING,
    img: DataTypes.STRING,
    category: DataTypes.STRING
  }, { tableName: 'products', timestamps: false });
  return Product;
};
module.exports = ProductSchema;
