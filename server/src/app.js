import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import { ApiResponse } from "./utility/ApiResponse.js"

const app = express()
dotenv.config()
app.use(cors({
    origin: process.env.CORS,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())



import userRouter from "./Routes/user.routes.js";
import companyRouter from "./Routes/company.routes.js";
import engineerRouter from "./Routes/engineer.routes.js";
import superOwnerRouter from "./Routes/superOwner.routes.js";
import issueRouter from "./Routes/issue.routes.js";
import adminRouter from "./Routes/admin.routes.js";



app.use("/api/v1/user", userRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/engineer", engineerRouter);
app.use("/api/v1/super-owner", superOwnerRouter);
app.use("/api/v1/issue", issueRouter);
app.use("/api/v1/admin", adminRouter);


app.get("/api/v1/running", (req, res) => {
    res.status(200).json(new ApiResponse(200, {}, "Server is running"))
})



export { app }