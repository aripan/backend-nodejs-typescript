import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";

// route parameters
interface RouteParams {
  id: string;
}

// response body
interface ResponseBody {
  message: string;
}

// request body
interface RequestBody {
  name: string;
  email: string;
  password: string;
}

// route query parameters
interface RouteQueryParams {
  username: string;
}

const example = asyncHandler(
  async (req: Request<RouteParams, ResponseBody, RequestBody, RouteQueryParams>, res: Response<ResponseBody>) => {
    //! access route parameters
    const { id } = req.params;

    //! access request body parameters
    const { name, email, password } = req.body;

    //! access request query parameters
    const { username } = req.query;

    res.send({ message: "Okay" });
  }
);

export { example };

//! IMPORTANT NOTE:

/*
interface Request<
  P = core.ParamsDictionary,       // Route parameters
  ResBody = any,                   // Response body
  ReqBody = any,                   // Request body
  ReqQuery = qs.ParsedQs,          // Query string parameters
  Locals extends Record<string, any> = Record<string, any> // Locals
>

Route Parameters (P): This is the type for route parameters, which are parts of the URL path. For example, in the route /users/:id, id is a route parameter. The default type is core.ParamsDictionary, which is an object containing the route parameters. You can define a custom type if your route has specific parameters.

Response Body (ResBody): This is the type for the response body that your route handler expects to send back to the client. The default type is any, meaning any type of response body is acceptable. You can define a more specific type if needed.

Request Body (ReqBody): This is the type for the request body sent by the client. The default type is also any, indicating that any type of request body is acceptable. You can define a more specific type if needed, such as an interface representing the structure of the expected request body.

Query String Parameters (ReqQuery): This is the type for query string parameters in the URL. The default type is qs.ParsedQs, which is an object containing the parsed query string parameters. You can define a custom type if your route expects specific query parameters.

Locals: This is an object representing local variables scoped to the request. The default type is Record<string, any>, meaning an object with string keys and any value types. Locals are often used to pass data between middleware functions and the route handler. You can define a more specific type for the locals object if needed.
*/

/*
interface Response<
  ResBody = any,                              // Response body
  Locals extends Record<string, any> = Record<string, any>  // Locals
>

Response Body (ResBody): This is the type for the response body that the server sends back to the client. The default type is any, meaning any type of response body is acceptable. You can define a more specific type if needed, such as an interface representing the structure of the expected response body.

Locals: This is an object representing local variables scoped to the response. The default type is Record<string, any>, meaning an object with string keys and any value types. Locals are often used to pass data between middleware functions and the route handler. You can define a more specific type for the locals object if needed.
*/

/*
! THIS IS AN EXAMPLE OF USING LOCALS(REQUEST AND RESPONSE)

import express, { Request, Response, NextFunction } from "express";

# Define a middleware to check authentication
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  # Simulate authentication
  const isAuthenticated = true;

  if (isAuthenticated) {
    # If authenticated, store user information in locals
    res.locals.user = {
      id: 123,
      username: "john_doe",
      email: "john@example.com"
    };
  }

  next();
};

# Define a route handler
const getUserInfo = (req: Request, res: Response) => {
  # Access user information stored in locals
  const user = res.locals.user;

  if (user) {
    res.json({
      id: user.id,
      username: user.username,
      email: user.email
    });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

# Create an Express app
const app = express();

# Use the authentication middleware for all routes
app.use(authenticate);

# Define the route to get user information
app.get("/user", getUserInfo);

# Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
*/
