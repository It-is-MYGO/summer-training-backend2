const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  desc: {
    type: DataTypes.TEXT
  },
  img: {
    type: DataTypes.STRING(255)
  },
  category: {
    type: DataTypes.STRING(100)
  },
  is_hot: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_drop: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Product;