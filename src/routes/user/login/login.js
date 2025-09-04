const express = require('express');
const router = express.Router();
const supabase = require('../../../../config/supabaseClient.js');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

/**
 * @swagger
 * tags:
 *   name: Users/Login
 *   description: User authentication
 */

// login a user
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Users/Login]
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
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing credentials
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
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

    const { data: user, error } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      console.error('Error finding user:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const { password: userPassword, ...userWithoutPassword } = user;
    
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token: token,
        loginTime: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Unexpected error during login:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

// logout a user
/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Log out a user (token-based)
 *     tags: [Users/Login]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized or invalid token
 *       500:
 *         description: Server error
 */
router.post('/logout', async (req, res) => {
  try {
    // Récupérer le token depuis l'header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier si le token est valide
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Optionnel : Vérifier que l'utilisateur existe encore
      const { data: user, error } = await supabase
        .from('user')
        .select('id, email')
        .eq('id', decoded.userId)
        .single();

      if (error && error.code === 'PGRST116') {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (error) {
        console.error('Error verifying user during logout:', error);
        return res.status(500).json({
          success: false,
          message: 'Logout failed',
          error: error.message
        });
      }

      // Logout réussi
      res.status(200).json({
        success: true,
        message: 'Logout successful',
        data: {
          userId: decoded.userId,
          email: decoded.email,
          logoutTime: new Date().toISOString()
        }
      });

    } catch (jwtError) {
      // Token invalide ou expiré
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

  } catch (err) {
    console.error('Unexpected error during logout:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

module.exports = router;
