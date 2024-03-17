// require("dotenv").config({ path: "./env" });
import "dotenv/config";
import connectDB from "./db";

// connect to database
connectDB();

/*
@ Basic Approach to connect to MongoDB

const app: Application = express();

const connectionString = `${process.env.MONGODB_URI}/${DB_NAME}`;
const PORT = process.env.PORT || 4000;

// IIFE => Immediately Invoked Function Expression
(async () => {
  try {
    // connect to MongoDB
    await connect(connectionString);

    // listen for error events
    app.on("error", (err) => {
      console.log("Error: ", err);
      throw err;
    });

    // listen to the server
    app.listen(PORT, () => {
      console.info(`App is listening on ${PORT}`);
    });
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
})();

*/
