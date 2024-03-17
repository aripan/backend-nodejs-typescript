import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Application = express();

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// JSON parser
app.use(express.json({ limit: "16kb" }));

/*
sometimes we see that when we put an url in the browser, it handles the request url in two different ways:
- replaces the spaces in url with +
- replaces the spaces in url with %20%

so we need to tell the express about that

extended => it can take the nested objects such as objects inside the object hierarchy
*/
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

/*
sometimes we might keep few images or files in the public folder and need to access them. so this configuration will provide that static access.
*/
app.use(express.static("public"));

// parse the cookies
app.use(cookieParser());

export default app;
