import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from '../utils/AppError';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface JwtPayload {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id, active: true },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      logger.warn(`User ${req.user.email} with role ${req.user.roleName} attempted to access restricted resource`);
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

// Helper function to generate JWT token
export const generateToken = (user: {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
}): string => {
  const jwtOptions: any = {};
  if (config.jwt.expiresIn) {
    jwtOptions.expiresIn = config.jwt.expiresIn;
  }
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.roleName,
    },
    config.jwt.secret,
    jwtOptions
  );
};