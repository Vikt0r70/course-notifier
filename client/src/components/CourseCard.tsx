import React from 'react';
import { Star, Clock, MapPin, User, Calendar, BookOpen, GraduationCap } from 'lucide-react';
import { Course } from '../types';
import { Badge } from './ui';
import { cn } from './ui/utils';

interface CourseCardProps {
  course: Course;
  onToggleWatch: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onToggleWatch }) => {
  return (
    <div 
      className={cn(
        'bg-zinc-900/50 backdrop-blur-xl border rounded-2xl p-4 space-y-3 transition-all duration-200',
        course.isWatching 
          ? 'border-amber-500/50 bg-amber-500/5' 
          : 'border-zinc-800/50 hover:border-zinc-700/50'
      )}
      dir="rtl"
    >
      {/* Header - Course Name & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-zinc-100 line-clamp-2 mb-1">
            {course.courseName}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono text-cyan-400">{course.courseCode}</span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400">شعبة {course.section}</span>
          </div>
        </div>
        
        {/* Status Badge */}
        <Badge variant={course.isOpen ? 'success' : 'danger'} className="shrink-0">
          {course.isOpen ? 'مفتوح' : 'مغلق'}
        </Badge>
      </div>

      {/* Course Details Grid */}
      <div className="space-y-2 text-sm">
        {/* Instructor */}
        <div className="flex items-center gap-2 text-zinc-300">
          <User className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="truncate">{course.instructor}</span>
        </div>

        {/* Days & Time */}
        <div className="flex items-center gap-2 text-zinc-300">
          <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>{course.days}</span>
          <span className="text-zinc-500">•</span>
          <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>{course.time}</span>
        </div>

        {/* Room */}
        <div className="flex items-center gap-2 text-zinc-300">
          <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>{course.room}</span>
        </div>

        {/* Credit Hours & Teaching Method */}
        <div className="flex items-center gap-3 text-zinc-300">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>{course.creditHours} ساعة</span>
          </div>
          <span className="text-zinc-500">•</span>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="truncate">{course.teachingMethod}</span>
          </div>
        </div>
      </div>

      {/* Watch Button */}
      <div className="pt-2 border-t border-zinc-800/50">
        <button
          onClick={() => onToggleWatch(course)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all duration-200',
            course.isWatching 
              ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30' 
              : 'text-zinc-400 bg-zinc-800/50 hover:bg-zinc-800 hover:text-amber-400'
          )}
        >
          <Star className={cn('w-5 h-5', course.isWatching && 'fill-current')} />
          <span>{course.isWatching ? 'إزالة من المتابعة' : 'إضافة للمتابعة'}</span>
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
