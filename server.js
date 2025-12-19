require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const app = express();
app.use(express.json());

connectDB();

app.use("/api/auth",authRoutes);

app.use("/api-docs",swaggerUI.serve,swaggerUI.setup(swaggerSpec));

app.get("/",(req,res)=>{
    res.send("Swagger API Running...");
})

app.listen(process.env.PORT,()=>{
    console.log("Server running at port 3000");
})