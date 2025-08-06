import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../middleware/asyncHandler';
import { loginSchema, registerSchema, LoginInput, RegisterInput } from '../schemas/auth.schema';
import { generateToken } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

/**
 * User login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = loginSchema.parse(req.body) as LoginInput;
  const { email, password } = validatedData;

  // Find user with role
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.active) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
  });

  logger.info(`User ${email} logged in successfully`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    },
  });
});

/**
 * User registration
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = registerSchema.parse(req.body) as RegisterInput;
  const { email, password, firstName, lastName, roleId } = validatedData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  // Verify role exists
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new AppError('Invalid role ID', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId,
    },
    include: { role: true },
  });

  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
  });

  logger.info(`New user registered: ${email} with role ${role.name}`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
      },
    },
  });
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { role: true },
    
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
      },
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

/**
 * Logout (client-side token removal)
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token from storage
  
  logger.info(`User ${req.user?.email} logged out`);
  
  res.json({
    success: true,
    message: 'Logout successful',
  });
});