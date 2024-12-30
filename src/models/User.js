module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      is_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      front_license_image: {
        type: DataTypes.STRING,
        allowNull: true
      },
      back_license_image: {
        type: DataTypes.STRING,
        allowNull: true
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    });
  
    User.associate = (models) => {
      User.belongsTo(models.Role, { foreignKey: "role_id" });
    };
  
    return User;
  };