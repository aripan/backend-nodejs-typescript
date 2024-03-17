import { connect } from "mongoose";
import { DB_NAME } from "../constants";

const connectionString = `${process.env.MONGODB_URI}/${DB_NAME}`;

const connectDB = async () => {
  try {
    const connectionInstance = await connect(connectionString);
    // console.dir(connectionInstance, { depth: null }); // Shows all properties without depth limit
    console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("Error connecting to database", error);
    process.exit(1);
  }
};

export default connectDB;
