import { eq } from 'drizzle-orm';
import { db } from '../../shared/database/connection';
import { users } from '../../shared/database/schema';
import { User } from '../../shared/types/user';
import { hashPassword } from '../utils/password';
import { logger } from '../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export async function createUser(email: string, password: string, name: string): Promise<User> {
  try {
    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();
    
    const [newUser] = await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    logger.info(`User created successfully: ${email}`);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
  } catch (error) {
    logger.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return null;
    }

    return user as User;
  } catch (error) {
    logger.error('Error finding user by email:', error);
    throw new Error('Failed to find user');
  }
}

export async function findUserById(id: string): Promise<User | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    logger.error('Error finding user by ID:', error);
    throw new Error('Failed to find user');
  }
}

export async function updateUser(id: string, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User | null> {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      return null;
    }

    logger.info(`User updated successfully: ${id}`);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  } catch (error) {
    logger.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
}

