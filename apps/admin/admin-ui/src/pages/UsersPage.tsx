import React from "react";
import PageHeader from "../components/layout/PageHeader";
import Spinner from "../components/common/Spinner";
import Card from "../components/common/Card";
import { useUsers, useDeleteUser } from "../hooks/apiHooks";

const UsersPage: React.FC = () => {
  const { data: users, isLoading, isError, error } = useUsers();
  const deleteUserMutation = useDeleteUser();

  const handleDelete = (userId: string | number, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleAddUser = () => {
    alert("Add User modal will be implemented here.");
  };

  if (isLoading) return <Spinner />;
  /*
  if (isError)
    return (
      <p className="text-red-500">Error fetching users: {error.message}</p>
    );
    */

  return (
    <>
      <PageHeader
        title="👥 User Management"
        subtitle="Manage users for TURN authentication"
      />
      <Card>
        <div className="p-5 border-b border-slate-200 flex justify-between items-center -m-5 mb-5">
          <h2 className="text-lg font-semibold text-slate-700">
            Registered Users
          </h2>
          <button
            onClick={handleAddUser}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
          >
            ➕ Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th-cell">Username</th>
                <th className="th-cell">Realm</th>
                <th className="th-cell">Created At</th>
                <th className="th-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users && users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="td-cell font-medium text-slate-900">
                      {user.username}
                    </td>
                    <td className="td-cell text-slate-500">{user.realm}</td>
                    <td className="td-cell text-slate-500">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleString()
                        : "N/A"}
                    </td>
                    <td className="td-cell">
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        disabled={
                          deleteUserMutation.isPending &&
                          deleteUserMutation.variables === user.id
                        }
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deleteUserMutation.isPending &&
                        deleteUserMutation.variables === user.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

export default UsersPage;
