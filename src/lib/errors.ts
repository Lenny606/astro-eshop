export class BaseError extends Error {
  public readonly status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}

export class PaymentError extends BaseError {
  constructor(message: string = 'Payment processing failed') {
    super(message, 400);
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}
