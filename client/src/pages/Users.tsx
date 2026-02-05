import React, { useCallback, useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { usersApi, getErrorMessage } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserListItem {
  id: number;
  username: string;
  createdAt: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await usersApi.list({ page: pageNum, limit: 8 });
      setUsers(response.items || []);
      setTotalPages(response.totalPages);
      setPage(response.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Users</h1>
          <p className="text-gray-600 mt-1">Explore community members</p>
        </div>

        {error && (
          <Alert variant="destructive" data-testid="error-message">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No users yet</h2>
              <p className="text-gray-600">Once people register, they will show up here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{user.username}</h2>
                      <p className="text-sm text-gray-500">Joined {formatDate(user.createdAt)}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;
