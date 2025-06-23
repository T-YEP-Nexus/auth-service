// src/index.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.post('/create-user', async (req, res) => {
  try {
    const { user, password } = req.body;
    if (!user || !password) {
      return res.status(400).json({ error: 'user et password requis.' });
    }

    const { data, error } = await supabase
      .from('user') // remplace si besoin par ton nom de table exact
      .insert([{
        email,
        password
      }])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      success: true,
      user: data[0]
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur interne.' });
  }
});


// Récupérer un utilisateur Auth par ID
app.get('/test-user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) return res.status(400).json({ error: error.message });
  if (!data.user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
  res.json({ success: true, user: data.user });
});

// Lister utilisateurs Auth (limit 50)
app.get('/test-users', async (req, res) => {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 50 });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, users: data.users });
});

// Tester connexion Supabase
app.get('/test-connection', async (req, res) => {
  const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) return res.status(500).json({ connected: false, error: error.message });
  res.json({ connected: true, message: 'Connexion Supabase OK' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
