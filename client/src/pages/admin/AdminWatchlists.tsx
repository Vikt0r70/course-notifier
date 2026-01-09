import React from 'react';
import { useQuery } from 'react-query';
import { Star, Filter, Sparkles, RefreshCw } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Card, Badge, Spinner, EmptyState } from '../../components/ui';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';

const AdminWatchlists: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useQuery('adminWatchlists', () => adminService.getAllWatchlists());

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
          <h1 className="text-3xl font-bold text-zinc-100">Watchlist Management</h1>
          <p className="text-zinc-400 mt-1">View all user watchlist subscriptions</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">
            {data?.watchlists?.length || 0} Items
          </Badge>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Watchlists Table */}
      <Card className="overflow-hidden">
        {data?.watchlists?.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="rtl-content">Course Name</TableHead>
                  <TableHead className="rtl-content">Faculty</TableHead>
                  <TableHead>Similar Filters</TableHead>
                  <TableHead>Newly Opened Only</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.watchlists.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                          {item.user?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-zinc-200">{item.user?.username || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-medium text-zinc-200">
                      {item.courseCode}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {item.section}
                    </TableCell>
                    <TableCell className="rtl-content text-zinc-300 max-w-xs truncate">
                      {item.courseName}
                    </TableCell>
                    <TableCell className="rtl-content text-zinc-400">
                      {item.faculty}
                    </TableCell>
                    <TableCell>
                      {item.similarFilters && item.similarFilters.length > 0 ? (
                        <div className="flex items-center gap-1 text-cyan-400">
                          <Filter className="w-4 h-4" />
                          <span className="text-sm">{item.similarFilters.length} filter(s)</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.similarFilterNewlyOpened ? (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm">Yes</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-sm">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {new Date(item.addedAt).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={<Star className="w-16 h-16" />}
            title="No watchlist items"
            description="No users have added courses to their watchlist yet."
          />
        )}
      </Card>
    </div>
  );
};

export default AdminWatchlists;
