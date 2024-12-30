require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { sequelize } = require("./models");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use("/auth", authRoutes);

sequelize.authenticate()
  .then(() => console.log("Database connection has been established successfully."))
  .catch(err => console.error("Unable to connect to the database:", err));

const PORT = process.env.PORT || 7777;
sequelize.sync({ alter: true }).then(() => {
  console.log("Database synced.");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
