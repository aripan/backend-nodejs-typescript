export const DB_NAME = "backend-nodejs-typescript";

/*
  ! IMPORTANT: providing the httpOnly and secure flags => does not allow to modify the cookies in client side anymore.
  */
export const cookieOptions = {
  httpOnly: true,
  secure: true,
};
