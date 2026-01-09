import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { X, AlertCircle, Bug, Lightbulb, HelpCircle } from 'lucide-react';
import { reportService, ReportData } from '../services/reportService';
import { Button, Input } from './ui';
import { cn } from './ui/utils';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ isOpen, onClose }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ReportData>();

  const createMutation = useMutation(reportService.createReport, {
    onSuccess: () => {
      toast.success('Report submitted successfully! Thank you for your feedback.');
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit report');
    },
  });

  const onSubmit = (data: ReportData) => {
    createMutation.mutate(data);
  };

  if (!isOpen) return null;

  const categoryOptions = [
    { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-400' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-400' },
    { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-blue-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800/50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-100">Report a Problem</h2>
              <p className="text-sm text-zinc-400">Help us improve by reporting issues or suggesting features</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-2 hover:bg-zinc-800/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <Input
            label="Title"
            placeholder="Brief description of the issue"
            error={errors.title?.message}
            icon={<AlertCircle className="w-5 h-5" />}
            {...register('title', {
              required: 'Title is required',
              maxLength: { value: 255, message: 'Title must be 255 characters or less' },
            })}
          />

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              Category
            </label>
            <div className="grid grid-cols-3 gap-3">
              {categoryOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                    'bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700',
                    'hover:bg-zinc-800/30'
                  )}
                >
                  <input
                    type="radio"
                    value={option.value}
                    className="sr-only peer"
                    {...register('category', { required: 'Please select a category' })}
                  />
                  <div className={cn(
                    'peer-checked:scale-110 transition-transform',
                    option.color
                  )}>
                    <option.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-zinc-300 peer-checked:text-white">
                    {option.label}
                  </span>
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent peer-checked:border-cyan-500 peer-checked:shadow-lg peer-checked:shadow-cyan-500/20 transition-all"></div>
                </label>
              ))}
            </div>
            {errors.category && (
              <p className="text-sm text-red-400 mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-400">
              Description
            </label>
            <textarea
              placeholder="Please provide details about the issue or feature request..."
              rows={6}
              className={cn(
                'w-full px-4 py-3 bg-zinc-900/50 backdrop-blur-sm border rounded-xl',
                'text-zinc-100 placeholder-zinc-500',
                'focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20',
                'transition-all duration-200 resize-none',
                errors.description ? 'border-red-500/50' : 'border-zinc-800/50'
              )}
              {...register('description', {
                required: 'Description is required',
                maxLength: { value: 5000, message: 'Description must be 5000 characters or less' },
                minLength: { value: 10, message: 'Please provide more details (at least 10 characters)' },
              })}
            />
            {errors.description && (
              <p className="text-sm text-red-400 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={createMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createMutation.isLoading}
              icon={<AlertCircle className="w-4 h-4" />}
            >
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportProblemModal;
