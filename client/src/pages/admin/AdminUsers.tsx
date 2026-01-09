import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { Trash2, CheckCircle, XCircle, Shield, Users, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Card, Button, Badge, Spinner, EmptyState } from '../../components/ui';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery('adminUsers', () => adminService.getUsers());

  const deleteMutation = useMutation(
    (id: number) => adminService.deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        toast.success('User deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete user');
      }
    }
  );

  const toggleVerifyMutation = useMutation(
    (id: number) => adminService.toggleEmailVerification(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminUsers');
        toast.success('Verification status updated');
      },
      onError: () => {
        toast.error('Failed to update verification status');
      }
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">User Management</h1>
          <p className="text-zinc-400 mt-1">Manage registered users and their verification status</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">
            {data?.users?.length || 0} Users
          </Badge>
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {data?.users?.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="rtl-content">Faculty</TableHead>
                  <TableHead className="rtl-content">Major</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-zinc-400">
                      #{user.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-sm font-medium">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-200">{user.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {user.email}
                    </TableCell>
                    <TableCell className="rtl-content text-zinc-300">
                      {user.faculty}
                    </TableCell>
                    <TableCell className="rtl-content text-zinc-300">
                      {user.major}
                    </TableCell>
                    <TableCell>
                      {user.isEmailVerified ? (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">No</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <div className="flex items-center gap-1 text-amber-400">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm">Yes</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-sm">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleVerifyMutation.mutate(user.id)}
                          disabled={toggleVerifyMutation.isLoading}
                          icon={<RefreshCw className={`w-4 h-4 ${toggleVerifyMutation.isLoading ? 'animate-spin' : ''}`} />}
                        >
                          Toggle
                        </Button>
                        {!user.isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this user?')) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                            disabled={deleteMutation.isLoading}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            icon={<Trash2 className="w-4 h-4" />}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={<Users className="w-16 h-16" />}
            title="No users found"
            description="There are no registered users yet."
          />
        )}
      </Card>
    </div>
  );
};

export default AdminUsers;
