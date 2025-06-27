// 收藏表
module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define('Favorite', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: DataTypes.INTEGER,
    product_id: DataTypes.INTEGER,
    alert_price: DataTypes.DECIMAL(10,2)
  }, { tableName: 'favorites', timestamps: false });
  return Favorite;
};
