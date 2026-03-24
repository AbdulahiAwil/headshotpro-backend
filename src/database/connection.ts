import mongoose from "mongoose"
import config from "@/config"
import { logger } from "@/util/logger";


export const connectDatabase = async (): Promise<void> => {
    try {
        // Database connection logic goes here
        await mongoose.connect(config.database.url)
       logger.info("Database connected successfully");  
             
    } catch (error) {
         logger.error("Error connecting database")
        throw new Error("Database connection failed");
    }
}

mongoose.connection.on("disconnected", () => {
     logger.error("Database disconnected")
    throw new Error("Database disconnected");

});

mongoose.connection.on("error", (error) => {
     logger.error("Database connection error:", error)
    throw new Error("Database connection error", error);
})