import React from 'react';
import { useQuery } from 'react-query';
import { BookOpen, RefreshCw } from 'lucide-react';
import { courseService } from '../../services/courseService';
import { Card, Badge, Spinner, EmptyState } from '../../components/ui';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';

const AdminCourses: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useQuery('adminCourses', () =>
    courseService.getCourses({ limit: 1000 })
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
          <h1 className="text-3xl font-bold text-zinc-100">Course Management</h1>
          <p className="text-zinc-400 mt-1">View all courses scraped from the university system</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">
            {data?.stats?.total || 0} Courses
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

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-sm text-zinc-400 mb-1">Total Courses</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {data?.stats?.total || 0}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-zinc-400 mb-1">Open</p>
          <p className="text-2xl font-bold text-emerald-400">
            {data?.stats?.open || 0}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-zinc-400 mb-1">Closed</p>
          <p className="text-2xl font-bold text-red-400">
            {data?.stats?.closed || 0}
          </p>
        </Card>
      </div>

      {/* Courses Table */}
      <Card className="overflow-hidden">
        {data?.courses?.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Code</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="rtl-content">Course Name</TableHead>
                  <TableHead className="rtl-content">Faculty</TableHead>
                  <TableHead className="rtl-content">Instructor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.courses.map((course: any) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono font-medium text-zinc-200">
                      {course.courseCode}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {course.section}
                    </TableCell>
                    <TableCell className="rtl-content text-zinc-300 max-w-xs truncate">
                      {course.courseName}
                    </TableCell>
                    <TableCell className="rtl-content text-zinc-400">
                      {course.faculty}
                    </TableCell>
                    <TableCell className="rtl-content text-zinc-400">
                      {course.instructor || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={course.isOpen ? 'open' : 'closed'} />
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {new Date(course.lastUpdated).toLocaleString('en-US', {
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
            icon={<BookOpen className="w-16 h-16" />}
            title="No courses found"
            description="No courses have been scraped yet. Run the scraper to fetch courses."
          />
        )}
      </Card>
    </div>
  );
};

export default AdminCourses;
