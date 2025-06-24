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

// crud routes for the 'user' table

// get all users
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: data,
      count: data.length
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

// get a user by id
app.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // validate uuid format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.error('Error fetching user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

// get a user by email
app.get('/users/email/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format provided'
      });
    }

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.error('Error fetching user by email:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

// create a user with email and password
app.post('/users', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const { data: existingUser, error: checkError } = await supabase
      .from('user')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check existing user',
        error: checkError.message
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const { data, error } = await supabase
      .from('user')
      .insert([
        {
          email: email,
          password: password
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: data
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

// update a user's password or email


// create a user with email and default password
// delete a user
// login a user
// logout a user

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
