import React from 'react';
import { Star } from 'lucide-react';
import { Course } from '../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, EmptyState } from './ui';
import { cn } from './ui/utils';
import CourseCard from './CourseCard';

interface CourseTableProps {
  courses: Course[];
  onToggleWatch: (course: Course) => void;
}

const CourseTable: React.FC<CourseTableProps> = ({ courses, onToggleWatch }) => {
  if (courses.length === 0) {
    return (
      <EmptyState
        variant="search"
        title="No courses found"
        description="Try adjusting your search filters to find more courses."
      />
    );
  }

  return (
    <>
      {/* Mobile View - Cards */}
      <div className="block md:hidden space-y-3">
        {courses.map((course) => (
          <CourseCard 
            key={course.id} 
            course={course} 
            onToggleWatch={onToggleWatch} 
          />
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block">
        <Table rtl>
      <TableHeader>
        <TableRow>
          <TableHead>رمز المادة</TableHead>
          <TableHead>الشعبة</TableHead>
          <TableHead>اسم المادة</TableHead>
          <TableHead>الساعات</TableHead>
          <TableHead>القاعة</TableHead>
          <TableHead>المدرس</TableHead>
          <TableHead>الأيام</TableHead>
          <TableHead>الوقت</TableHead>
          <TableHead>طريقة التدريس</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>متابعة</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.id} watching={course.isWatching}>
            <TableCell className="font-mono text-sm">{course.courseCode}</TableCell>
            <TableCell>{course.section}</TableCell>
            <TableCell className="max-w-xs">
              <span className="line-clamp-1">{course.courseName}</span>
            </TableCell>
            <TableCell>{course.creditHours}</TableCell>
            <TableCell>{course.room}</TableCell>
            <TableCell className="max-w-[150px]">
              <span className="line-clamp-1">{course.instructor}</span>
            </TableCell>
            <TableCell>{course.days}</TableCell>
            <TableCell className="whitespace-nowrap">{course.time}</TableCell>
            <TableCell>{course.teachingMethod}</TableCell>
            <TableCell>
              <Badge variant={course.isOpen ? 'success' : 'danger'}>
                {course.isOpen ? 'مفتوح' : 'مغلق'}
              </Badge>
            </TableCell>
            <TableCell>
              <button
                onClick={() => onToggleWatch(course)}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200',
                  course.isWatching 
                    ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30' 
                    : 'text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/50'
                )}
                title={course.isWatching ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                <Star className={cn('w-5 h-5', course.isWatching && 'fill-current')} />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
      </div>
    </>
  );
};

export default CourseTable;
