import { db } from "../../database/client";
import { User } from "@coturn-cluster/shared/src/types";
import bcrypt from "bcryptjs";

const saltRounds = 10;

const mockUsers = [
  {
    id: "1",
    username: "admin",
    realm: "admin.local",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    username: "user1",
    realm: "user.local",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    username: "user2",
    realm: "user.local",
    createdAt: new Date().toISOString(),
  },
];

export class UserService {
  async getAllUsers(): Promise<Omit<User, "password">[]> {
    // TODO(Soner): Replace with actual database query
    // const result = await db.query(
    //   "SELECT id, username, realm, created_at, updated_at FROM users ORDER BY created_at DESC"
    // );
    return mockUsers;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    return result.rows[0] || null;
  }

  async createUser(userData: {
    username: string;
    password: string;
    realm: string;
  }): Promise<Omit<User, "password">> {
    const { username, password, realm } = userData;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      `INSERT INTO users (username, password, realm) VALUES ($1, $2, $3)
       RETURNING id, username, realm, created_at, updated_at`,
      [username, hashedPassword, realm]
    );

    return result.rows[0];
  }

  async deleteUserById(userId: string | number): Promise<boolean> {
    const result = await db.query("DELETE FROM users WHERE id = $1", [userId]);
    return result.rowCount > 0;
  }

  async updateUser(
    username: string | number,
    updates: Partial<Omit<User, "id" | "password">>
  ) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (
        key !== "id" &&
        key !== "username" &&
        key !== "created_at" &&
        key !== "updated_at"
      ) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error("No valid fields to update");
    }

    values.push(username);
    const query = `UPDATE users SET ${fields.join(
      ", "
    )}, updated_at = NOW() WHERE username = $${paramCount} RETURNING *`;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }
}

export const userService = new UserService();
