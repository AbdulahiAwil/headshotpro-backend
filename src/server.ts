import app from "@/app";
import config from "@/config";
import { connectDatabase } from "@/database/connection";
import { logger } from "./util/logger";


const startServer = async () => {
    try {
        // connectDatabase();

        if(config.env === 'production') {
            logger.info("Connection to production database")
            await connectDatabase();
        }else{
            logger.info("Connection to development database")
            await connectDatabase();
        }

        const server = app.listen(config.port, () => {
        logger.info(`Server is running on ${config.port}`);
        console.log(`Server is running on ${config.port}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
            logger.error(`Port ${config.port} is already in use.`);
        }else {
            logger.error('Server starting error:', error);
            process.exit(1);
        }
        
    });
        
    } catch (error) {

        logger.error('Error starting server:', error);
        process.exit(1);
        
    }
    
}

startServer();