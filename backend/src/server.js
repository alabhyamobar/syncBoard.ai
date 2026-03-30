import app from "./app.js";
import connectDB from "./config/database.js";

const port = process.env.PORT || 3000;

(async ()=>{
    try{
        await connectDB();
        app.listen(port,()=>{
            console.log(`app is runing at port ${port}`);
        })
    }catch (err){
        console.log(err);
        process.exit(1);
    }
})();