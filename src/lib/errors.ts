

export class AppError extends Error {
  constructor (public statusCode: number, message: string) {
    super(message)
  }
};

export class NotFoundError extends AppError {
  constructor(what: string) { 
    super(404, `${what} not found`);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(401, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message)
  }
}