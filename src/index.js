require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json());

const userRoute = require('./routes/user.js');

app.use('', userRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur démarré et à l'écoute sur le port ${PORT}`);
});