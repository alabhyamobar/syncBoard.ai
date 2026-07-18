import http from "http";
import app from "./app.js";
import connectDB from "./config/database.js";
import { initSocket } from "./collaboration/socket.js";

const port = process.env.PORT || 3000;

(async ()=>{
    try{
        await connectDB();
        const server = http.createServer(app);
        initSocket(server);
        server.listen(port,()=>{
            console.log(`app is runing at port ${port}`);
        });
    }catch (err){
        console.log(err);
        process.exit(1);
    }
})();
 