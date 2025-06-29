import { userService } from "../services/user.service";

export const getAllUsers = async () => {
  return userService.getAllUsers();
};

export const addUser = async (userData: {
  username: string;
  password: string;
  realm: string;
}) => {
  return userService.createUser(userData);
};

export const deleteUser = async (userId: string | number) => {
  const wasDeleted = await userService.deleteUserById(userId);
  if (!wasDeleted) {
    const error: any = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return { deleted: true };
};
