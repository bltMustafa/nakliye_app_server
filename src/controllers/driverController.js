const { User, Role } = require("../models");

const createDriver = async (req, res) => {
  try {
    const { userId, licenseNumber, licenseType, vehicleInfo } = req.body;

    if (!userId || !licenseNumber || !licenseType || !vehicleInfo) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const driverRole = await Role.findOne({ where: { name: "driver" }});
    if (!driverRole) {
      return res.status(404).json({
        success: false,
        message: "Driver role not found"
      });
    }

    user.role_id = driverRole.id;
    await user.save();

    // Here you would create driver specific details in a Driver model
    // const driver = await Driver.create({
    //   user_id: userId,
    //   license_number: licenseNumber, 
    //   license_type: licenseType,
    //   vehicle_info: vehicleInfo
    // });

    res.status(201).json({
      success: true,
      message: "Driver created successfully",
      data: {
        userId,
        licenseNumber,
        licenseType,
        vehicleInfo
      }
    });

  } catch (error) {
    console.error("Create Driver Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error
    });
  }
};

const getAllDrivers = async (req, res) => {
  try {
    const driverRole = await Role.findOne({ where: { name: "driver" }});
    const drivers = await User.findAll({
      where: { role_id: driverRole.id }
    });

    res.status(200).json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error("Get All Drivers Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error
    });
  }
};

const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await User.findOne({
      where: { 
        id,
        role_id: (await Role.findOne({ where: { name: "driver" }})).id
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    res.status(200).json({
      success: true,
      data: driver
    });
  } catch (error) {
    console.error("Get Driver Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error
    });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { licenseNumber, licenseType, vehicleInfo } = req.body;

    const driver = await User.findOne({
      where: { 
        id,
        role_id: (await Role.findOne({ where: { name: "driver" }})).id
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    // Here you would update driver specific details in Driver model
    // await Driver.update({
    //   license_number: licenseNumber,
    //   license_type: licenseType,
    //   vehicle_info: vehicleInfo
    // }, { where: { user_id: id }});

    res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      data: {
        id,
        licenseNumber,
        licenseType,
        vehicleInfo
      }
    });
  } catch (error) {
    console.error("Update Driver Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error
    });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    
    const driver = await User.findOne({
      where: { 
        id,
        role_id: (await Role.findOne({ where: { name: "driver" }})).id
      }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    // Here you would delete driver specific details from Driver model
    // await Driver.destroy({ where: { user_id: id }});
    
    // Reset user role to regular user
    const userRole = await Role.findOne({ where: { name: "user" }});
    driver.role_id = userRole.id;
    await driver.save();

    res.status(200).json({
      success: true,
      message: "Driver deleted successfully"
    });
  } catch (error) {
    console.error("Delete Driver Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error
    });
  }
};

module.exports = {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver
};
