import React from 'react';
import { GraduationCap, Building2, Clock, Search } from 'lucide-react';
import { Card } from './ui';
import { cn } from './ui/utils';
import { FilterOptions } from '../services/courseService';

interface FilterBarProps {
  filters: any;
  onFilterChange: (key: string, value: string) => void;
  filterOptions?: FilterOptions;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, filterOptions }) => {
  const isGraduate = filters.studyType === 'دراسات عليا' || filters.studyType === 'الدراسات العليا';

  // Custom select styling for RTL content
  const SelectField = ({ 
    icon: Icon, 
    label,
    value,
    onChange,
    children,
    className = ''
  }: { 
    icon: any; 
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className}>
      <label className="block text-sm font-medium text-zinc-400 mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
          <Icon className="w-5 h-5" />
        </div>
        <select
          value={value}
          onChange={onChange}
          className={cn(
            'w-full pl-11 pr-10 py-3 appearance-none cursor-pointer',
            'bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl',
            'text-zinc-100',
            'focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
            'transition-all duration-200'
          )}
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundPosition: 'right 12px center',
            backgroundSize: '20px',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {children}
        </select>
      </div>
    </div>
  );

  // Get faculty options from dynamic data or fallback to defaults
  const getFacultyOptions = () => {
    if (isGraduate) {
      // For graduate, show programs (ماجستير, دبلوم عالي)
      const programs = filterOptions?.programs || ['ماجستير', 'دبلوم عالي'];
      return programs.map((p) => (
        <option key={p} value={p} className="bg-zinc-900">{p}</option>
      ));
    } else {
      // For bachelor, show faculties from database
      const faculties = filterOptions?.faculties || [];
      return faculties
        .filter((f) => f !== 'الدراسات العليا') // Exclude graduate faculty
        .map((f) => (
          <option key={f} value={f} className="bg-zinc-900">{f}</option>
        ));
    }
  };

  // Get time shift options from dynamic data
  const getTimeShiftOptions = () => {
    // Use API data if available, otherwise use defaults
    const shifts = filterOptions?.timeShifts?.length 
      ? filterOptions.timeShifts 
      : ['صباحي', 'مسائي'];
    return shifts.map((s) => (
      <option key={s} value={s} className="bg-zinc-900">
        {s === 'صباحي' ? 'Morning (صباحي)' : s === 'مسائي' ? 'Evening (مسائي)' : s}
      </option>
    ));
  };

  return (
    <Card>
      <h2 className="text-xl font-bold text-zinc-100 mb-4">Search Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Study Type */}
        <SelectField
          icon={GraduationCap}
          label="Study Type"
          value={filters.studyType}
          onChange={(e) => onFilterChange('studyType', e.target.value)}
        >
          <option value="بكالوريوس" className="bg-zinc-900">Bachelor's (بكالوريوس)</option>
          <option value="دراسات عليا" className="bg-zinc-900">Postgraduate (دراسات عليا)</option>
        </SelectField>

        {/* Faculty / Program - Dynamic based on study type */}
        <SelectField
          icon={Building2}
          label={isGraduate ? 'Program' : 'Faculty'}
          value={filters.faculty}
          onChange={(e) => onFilterChange('faculty', e.target.value)}
        >
          <option value="" className="bg-zinc-900">All</option>
          {getFacultyOptions()}
        </SelectField>

        {/* Time Shift - Only for bachelor's */}
        {!isGraduate && (
          <SelectField
            icon={Clock}
            label="Time Shift"
            value={filters.timeShift}
            onChange={(e) => onFilterChange('timeShift', e.target.value)}
          >
            <option value="" className="bg-zinc-900">All</option>
            {getTimeShiftOptions()}
          </SelectField>
        )}

        {/* Search Input - Now INSTANT, no debounce needed */}
        <div className={isGraduate ? 'md:col-span-2' : ''}>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Search
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search by course name, code, or instructor..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className={cn(
                'w-full pl-11 pr-4 py-3',
                'bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl',
                'text-zinc-100 placeholder:text-zinc-500',
                'focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FilterBar;
