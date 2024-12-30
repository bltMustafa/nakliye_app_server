const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Role } = require("../models");

const register = async (req, res) => {
  const { name, phone, password, role } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: "Name, phone and password are required fields!" });
  }

  try {
    const existingUser = await User.findOne({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ message: "This phone number is already registered!" });
    }

    const validRoles = ["user", "driver", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role: ${role}` });
    }

    if (role === "driver" && (!req.body.frontLicenseImage || !req.body.backLicenseImage)) {
      return res.status(400).json({ 
        message: "Front and back license images are required for driver registration"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = await Role.findOne({ where: { name: role || "user" } });
    if (!userRole) {
      return res.status(400).json({ message: "Role not found." });
    }

    const userData = {
      name,
      phone,
      password: hashedPassword,
      role_id: userRole.id,
    };

   
    if (role === "driver") {
      userData.front_license_image = req.body.frontLicenseImage;
      userData.back_license_image = req.body.backLicenseImage;
      userData.is_approved = false;
    }

    const newUser = await User.create(userData);

    res.status(201).json({
      message: "User created successfully.",
      user: { 
        id: newUser.id, 
        name: newUser.name, 
        phone: newUser.phone,
        role: role,
        isApproved: role === "driver" ? false : null
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error", error: error.message || error });
  }
};

// TODO: role driver ise resimleri kontrol et  
const login = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: "Phone and password are required fields!" });
  }

  try {
    const cleanPhone = phone.replace(/\s+/g, '');

    const user = await User.findOne({ 
      where: { 
        phone: {
          [Op.or]: [phone, cleanPhone],
        }
      },
      include: [{
        model: Role,
        attributes: ['name']
      }]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password!" });
    }

    // Check if driver is approved
    if (user.Role.name === "driver" && !user.is_approved) {
      return res.status(403).json({ 
        message: "Your driver account is pending approval from admin"
      });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        phone: user.phone, 
        role: user.Role.name,
        isApproved: user.is_approved 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        phone: user.phone, 
        role: user.Role.name,
        isApproved: user.is_approved
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message || error });
  }
};

const getAllUsers = async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'phone', 'role_id', 'is_approved', 'front_license_image', 'back_license_image'],
        include: [{
          model: Role,
          attributes: ['name']
        }]
      });
  
      const formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name, 
        phone: user.phone,
        role: user.Role.name,
        isApproved: user.is_approved,
        frontLicenseImage: user.Role.name === 'driver' ? user.front_license_image : null,
        backLicenseImage: user.Role.name === 'driver' ? user.back_license_image : null
      }));
  
      res.status(200).json({
        success: true,
        users: formattedUsers
      });
    } catch (error) {
      console.error("Get All Users Error:", error);
      res.status(500).json({ 
        success: false,
        message: "Server error", 
        error: error.message || error 
      });
    }
};

const getOneUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id },
      attributes: ['id', 'name', 'phone', 'role_id', 'is_approved', 'front_license_image', 'back_license_image'],
      include: [{
        model: Role,
        attributes: ['name']
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const formattedUser = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.Role.name,
      isApproved: user.is_approved,
      frontLicenseImage: user.Role.name === 'driver' ? user.front_license_image : null,
      backLicenseImage: user.Role.name === 'driver' ? user.back_license_image : null
    };

    res.status(200).json({
      success: true,
      user: formattedUser
    });
  } catch (error) {
    console.error("Get One User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role_id } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const updateData = {
      name,
      phone,
      role_id
    };

    // If updating to driver role, require license images
    if (role_id === 2 && (!req.body.frontLicenseImage || !req.body.backLicenseImage)) {
      return res.status(400).json({
        success: false,
        message: "Front and back license images are required for driver role"
      });
    }

    if (role_id === 2) {
      updateData.front_license_image = req.body.frontLicenseImage;
      updateData.back_license_image = req.body.backLicenseImage;
      updateData.is_approved = false;
    }

    await user.update(updateData);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role_id: user.role_id,
        isApproved: user.is_approved,
        frontLicenseImage: user.front_license_image,
        backLicenseImage: user.back_license_image
      }
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      success: false, 
      message: "Server error",
      error: error.message || error
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error", 
      error: error.message || error
    });
  }
};

// TODO: admin olarak sürücüleri onaylayabilmek için endpoint oluştur 
const approveDriver = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const user = await User.findOne({
      where: { id: userId },
      include: [{
        model: Role,
        attributes: ['name']
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.Role.name !== "driver") {
      return res.status(400).json({
        success: false,
        message: "User is not a driver"
      });
    }

    if (req.user.role_id !== 1) {
      return res.status(403).json({
        success: false,
        message: "Only admins can approve drivers"
      });
    }

    if (!user.front_license_image || !user.back_license_image) {
      return res.status(400).json({
        success: false,
        message: "Driver must upload both front and back license images before approval"
      });
    }

    await user.update({
      is_approved: true,
      approved_at: new Date(),
      approved_by: req.user.id
    });

    res.status(200).json({
      success: true,
      message: "Driver approved successfully",
      data: {
        userId: user.id,
        isApproved: user.is_approved,
        approvedAt: user.approved_at,
        approvedBy: user.approved_by,
        frontLicenseImage: user.front_license_image,
        backLicenseImage: user.back_license_image
      }
    });

  } catch (error) {
    console.error("Driver Approval Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error
    });
  }
};


module.exports = { 
  register, 
  login, 
  getAllUsers, 
  getOneUser, 
  updateUser, 
  deleteUser,
  approveDriver,
};







