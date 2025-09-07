import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter  from "./routes/authRoutes.js"
import sendMail from "./config/nodemailer.js";

const app = express();
const port  = process.env.PORT ||  3000 
connectDB();

app.use (express.json());
app.use(cookieParser());
app.use(cors({credentials :true}))

//Api Endpoints
app.get('/' ,(req,res)=>  res.send("API working"));
app.use('/api/auth', authRouter )



app.listen(port,()=> console.log(`server is running at PORT : ${port}`));