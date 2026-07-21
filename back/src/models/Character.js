const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Character = sequelize.define('Character', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    race: { type: DataTypes.STRING, allowNull: false },
    class: { type: DataTypes.STRING, allowNull: false },
    strength: { type: DataTypes.INTEGER, allowNull: false },
    dexterity: { type: DataTypes.INTEGER, allowNull: false },
    constitution: { type: DataTypes.INTEGER, allowNull: false },
    intelligence: { type: DataTypes.INTEGER, allowNull: false },
    wisdom: { type: DataTypes.INTEGER, allowNull: false },
    charisma: { type: DataTypes.INTEGER, allowNull: false },
}, {
    tableName: 'Characters',
});

module.exports = Character;
