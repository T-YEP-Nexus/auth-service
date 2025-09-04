require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const auth = require("./middleware/auth");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const userRoute = require("./routes/user/user.js");
const userLoginRoute = require("./routes/user/login/login.js");

// Protéger toutes les routes (sauf /login et /api-docs) via middleware d'auth
app.use(auth);

app.use("", userRoute);
app.use("", userLoginRoute);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré et à l'écoute sur le port ${PORT}`);
});
