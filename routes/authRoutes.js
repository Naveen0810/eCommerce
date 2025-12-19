const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Product = require("../models/product");
const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
 
const router = express.Router();


// ================= SIGNUP =================
router.post("/signup", async (req, res) => {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = new User({
        name,
        email,
        password: hashedPassword,
        role
    });

    await user.save();

    res.json({ message: "Signup successful" });
});
  

// ================= LOGIN =================
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({token});
});


// ================= PROTECTED PROFILE =================
router.get("/profile", auth, async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
});


// ================= ADMIN ROUTE =================
router.get("/admin/users", auth, admin, async (req, res) => {
    const users = await User.find().select("-password");
    res.json(users);
});

router.post("/admin/addProduct",auth,admin,async (req,res) => {
    const { pID, name, price, mfDate, expDate, quantity } = req.body;
    const product = new Product({ pID, name, price, mfDate, expDate, quantity });
    await product.save();
    res.json({ message: "Product added successfully", product });
});

// ================= ADMIN UPDATE PRODUCT =================
router.put("/admin/updateProduct/:pID", auth, admin, async (req, res) => {
    const { pID } = req.params;
    const updates = req.body;
    const product = await Product.findOneAndUpdate({ pID }, updates, { new: true });
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product updated successfully", product });
});

// ================= ADMIN DELETE PRODUCT =================
router.delete("/admin/deleteProduct/:pID", auth, admin, async (req, res) => {
    const { pID } = req.params;
    const product = await Product.findOneAndDelete({ pID });
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    const adminUser = await User.findById(req.user.id).select("name email");
    console.log(`Product with pID ${pID} deleted by admin Name:(${adminUser.name}) , Email:(${adminUser.email}) at ${new Date().toISOString()}`);
    res.json({ message: "Product deleted successfully" });
});

//=============VIEW PRODUCTS=============
router.get("/viewProducts",auth,async(req,res) => {
    const user = await User.findById(req.user.id).select("-password");
    const products = await Product.find();
    res.json(products);
})

// ================= ADD TO CART =================
router.post("/addToCart", auth, async (req, res) => {
    const { pID, quantity } = req.body;
    const user = await User.findById(req.user.id);
    const product = await Product.findOne({ pID });
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    // Check if product already in cart
    const existingItem = user.cart.find(item => item.product.toString() === product._id.toString());
    if (existingItem) {
        existingItem.quantity += quantity || 1;
    } else {
        user.cart.push({ product: product._id, quantity: quantity || 1 });
    }
    await user.save();
    res.json({ message: "Product added to cart", cart: user.cart });
});

// ================= VIEW CART =================
router.get("/cart", auth, async (req, res) => {
    const user = await User.findById(req.user.id).populate('cart.product');
    res.json(user.cart);
});

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Signup new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signup successful
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user and get JWT token
 *     tags: [Auth]
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
 *         description: JWT token returned
 */

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get logged-in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/auth/admin/users:
 *   get:
 *     summary: Admin – Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Admin access denied
 */

/**
 * @swagger
 * /api/auth/admin/addProduct:
 *   post:
 *     summary: Admin – Add a new product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pID:
 *                 type: number
 *               name:
 *                 type: string
 *               price:
 *                 type: string
 *               mfDate:
 *                 type: string
 *                 format: date
 *               expDate:
 *                 type: string
 *                 format: date
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product added successfully
 *       403:
 *         description: Admin access denied
 */

/**
 * @swagger
 * /api/auth/admin/updateProduct/{pID}:
 *   put:
 *     summary: Admin – Update a product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pID
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: string
 *               mfDate:
 *                 type: string
 *                 format: date
 *               expDate:
 *                 type: string
 *                 format: date
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       403:
 *         description: Admin access denied
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/auth/admin/deleteProduct/{pID}:
 *   delete:
 *     summary: Admin – Delete a product
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pID
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       403:
 *         description: Admin access denied
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/auth/viewProducts:
 *   get:
 *     summary: View all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/auth/addToCart:
 *   post:
 *     summary: Add product to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pID:
 *                 type: number
 *               quantity:
 *                 type: number
 *                 default: 1
 *     responses:
 *       200:
 *         description: Product added to cart
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /api/auth/cart:
 *   get:
 *     summary: View user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's cart
 *       401:
 *         description: Unauthorized
 */


module.exports = router;