import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { AlertCircle, Trash2, Bug, Lightbulb, HelpCircle, User as UserIcon, Mail, Calendar } from 'lucide-react';
import { reportService, Report } from '../../services/reportService';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, Button, Badge } from '../../components/ui';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { format } from 'date-fns';

const AdminReports: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: reportsData, isLoading } = useQuery(
    ['admin-reports', page],
    () => reportService.getReports({ page, limit }),
    {
      keepPreviousData: true,
    }
  );

  const deleteMutation = useMutation(reportService.deleteReport, {
    onSuccess: () => {
      toast.success('Report deleted successfully');
      queryClient.invalidateQueries('admin-reports');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete report');
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this report?')) {
      deleteMutation.mutate(id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return <Bug className="w-4 h-4" />;
      case 'feature': return <Lightbulb className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug': return 'error';
      case 'feature': return 'warning';
      default: return 'info';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const reports = reportsData?.data?.reports || [];
  const pagination = reportsData?.data?.pagination || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Problem Reports</h1>
          <p className="text-zinc-400 mt-1">View and manage user-reported issues</p>
        </div>
        <Badge variant="info" icon={<AlertCircle className="w-3 h-3" />}>
          {pagination.total || 0} Total
        </Badge>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-zinc-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No reports found</p>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report: Report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-zinc-400">
                      #{report.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-zinc-200">
                          <UserIcon className="w-4 h-4 text-zinc-400" />
                          {report.user?.username || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Mail className="w-3 h-3" />
                          {report.user?.email || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-zinc-200 truncate">{report.title}</p>
                        <p className="text-sm text-zinc-400 truncate mt-1">{report.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getCategoryColor(report.category) as any}
                        icon={getCategoryIcon(report.category)}
                      >
                        {report.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.status === 'pending' ? 'warning' : 'success'}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {format(new Date(report.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDelete(report.id)}
                        loading={deleteMutation.isLoading}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination.pages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminReports;
