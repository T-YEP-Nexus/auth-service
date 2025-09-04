const express = require('express');
const router = express.Router();
const supabase = require('../../../config/supabaseClient.js');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

// crud routes for the 'user' table
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management 
 */

// get all users
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/users', async (req, res) => {
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
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User UUID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/users/:id', async (req, res) => {
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
      if (error.code === 'PGRST116' || data === null) {
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
/**
 * @swagger
 * /users/email/{email}:
 *   get:
 *     summary: Get user by email
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         description: Email address
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: Invalid email
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/users/email/:email', async (req, res) => {
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
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
router.post('/users', async (req, res) => {
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

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const { data, error } = await supabase
      .from('user')
      .insert([
        {
          email: email,
          password: hashedPassword
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
/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Update a user's email or password
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User UUID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Server error
 */
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    if (!email && !password) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (email or password) must be provided'
      });
    }

    const updateData = {};

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      const { data: existingUser, error: checkError } = await supabase
        .from('user')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing email:', checkError);
        return res.status(500).json({
          success: false,
          message: 'Failed to check existing email',
          error: checkError.message
        });
      }

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists for another user'
        });
      }

      updateData.email = email;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateData.password = hashedPassword;
    }

    const { data, error } = await supabase
      .from('user')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.error('Error updating user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
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

// delete a user
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User UUID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Invalid ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    const { data: existingUser, error: checkError } = await supabase
      .from('user')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.error('Error checking user existence:', checkError);
      return res.status(500).json({
        success: false,
        message: 'Failed to check user existence',
        error: checkError.message
      });
    }

    const { error } = await supabase
      .from('user')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUser: existingUser
      }
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



module.exports = router;