import { NextFunction, Request, Response } from "express";

const asyncHandler = (requestHandler: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

/*
const asyncHandler = (requestHandler: Function) => { ... }: This defines a function called asyncHandler that takes a single argument requestHandler, which is expected to be a function.

return (req: Request, res: Response, next: NextFunction) => { ... }: This returns another function which takes three arguments: req, res, and next. These are common objects used in Node.js for handling HTTP requests and responses. req represents the request object, res represents the response object, and next is a callback function that passes control to the next middleware in the stack.

Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));: Inside the returned function, it immediately invokes the requestHandler function with the provided req, res, and next parameters. This requestHandler function is expected to return a Promise (or a value, which will be wrapped into a Promise by Promise.resolve()). The .catch() method is used to catch any errors that occur during the execution of the requestHandler function. If an error occurs, it calls the next function with the error passed as an argument, effectively passing the error to the next middleware or error handler.
*/

export { asyncHandler };

/*
const asyncHandler = () => {};
const asyncHandler = (func: Function) => {
  () => {};
};
const asyncHandler = (func: Function) => {
  async () => {};
};

! as we know that for a single line arrow function we don't need the curly braces.
! so we can write as
const asyncHandler = (func: Function) => async () => {};
*/

/*
interface CustomError extends Error {
  code?: number;
}

const asyncHandler = (func: Function) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await func(req, res, next);
  } catch (error) {
    const err = error as CustomError;
    res.status(err.code || 500).json({
      success: false,
      message: err.message,
    });
  }
};
*/
