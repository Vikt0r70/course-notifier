import React from 'react';
import { cn } from './utils';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  rtl?: boolean;
}

export const Table: React.FC<TableProps> = ({ className, rtl = true, children, ...props }) => {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className={cn(
            'w-full border-collapse',
            rtl && 'direction-rtl',
            className
          )}
          style={{ direction: rtl ? 'rtl' : 'ltr' }}
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  );
};

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader: React.FC<TableHeaderProps> = ({ className, children, ...props }) => {
  return (
    <thead className={cn('', className)} {...props}>
      {children}
    </thead>
  );
};

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody: React.FC<TableBodyProps> = ({ className, children, ...props }) => {
  return (
    <tbody className={cn('', className)} {...props}>
      {children}
    </tbody>
  );
};

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  watching?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  className,
  selected,
  watching,
  children,
  ...props
}) => {
  return (
    <tr
      className={cn(
        'transition-colors duration-150 hover:bg-zinc-800/30',
        selected && 'bg-cyan-500/10',
        watching && 'bg-violet-500/10',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
};

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHead: React.FC<TableHeadProps> = ({ className, children, ...props }) => {
  return (
    <th
      className={cn(
        'bg-zinc-800/50 text-zinc-300 font-semibold px-4 py-3',
        'text-start border-b border-zinc-700/50',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
};

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell: React.FC<TableCellProps> = ({ className, children, ...props }) => {
  return (
    <td
      className={cn(
        'px-4 py-3 text-zinc-100 border-b border-zinc-800/50',
        'text-start',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
};

export default Table;
