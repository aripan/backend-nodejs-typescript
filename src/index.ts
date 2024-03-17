import 'dotenv/config'
import express, {
  Request,
  Response,
  NextFunction,
  Application,
  ErrorRequestHandler,
} from "express";
import { Server } from "http";
import createHttpError from "http-errors";

const app: Application = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("hello world");
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next(new createHttpError.NotFound());
});

const errorHandler: ErrorRequestHandler = (
  error: createHttpError.HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res
    .status(error.status || 500)
    .send({ status: error.status || 500, message: error.message });
};

app.use(errorHandler);

const server: Server = app.listen(PORT, () => console.info(`🚀 is on ${PORT}`));
