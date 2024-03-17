import { NextFunction, Request, Response } from "express";

const asyncHandler = (requestHandler: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

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
