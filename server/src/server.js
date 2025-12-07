import connectDB from "./DB/index.js";
import { app } from "./app.js";
connectDB()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`server is running at port: ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONGO_connection failed", err);
    })