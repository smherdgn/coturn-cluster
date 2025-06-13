import { db } from '../database/client';

export interface User {
id: number;
username: string;
password: string;
realm: string;
quota_mb?: number;
bandwidth_bps?: number;
expires_at?: string;
created_at: string;
updated_at: string;
}

export class UserService {
async getAllUsers(): Promise<User[]> {
const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
return result.rows;
}

async getUserByUsername(username: string): Promise<User | null> {
const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
return result.rows[0] || null;
}

async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
const { username, password, realm, quota_mb, bandwidth_bps, expires_at } = userData;

const result = await db.query(
`INSERT INTO users (username, password, realm, quota_mb, bandwidth_bps, expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *`,
[username, password, realm, quota_mb, bandwidth_bps, expires_at]
);

return result.rows[0];
}

async updateUser(username: string, updates: Partial<User>): Promise<User | null> {
const fields: string[] = [];
const values: any[] = [];
let paramCount = 1;

Object.entries(updates).forEach(([key, value]) => {
if (key !== 'id' && key !== 'username' && key !== 'created_at' && key !== 'updated_at') {
fields.push(`${key} = $${paramCount}`);
values.push(value);
paramCount++;
}
});

if (fields.length === 0) {
throw new Error('No valid fields to update');
}

values.push(username);
const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE username = $${paramCount} RETURNING *`;

const result = await db.query(query, values);
return result.rows[0] || null;
}

async deleteUser(username: string): Promise<boolean> {
const result = await db.query('DELETE FROM users WHERE username = $1', [username]);
return result.rowCount > 0;
}
}

export const userService = new UserService();
