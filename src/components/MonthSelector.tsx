import { format, addMonths, subMonths, parse } from 'date-fns';
import { ko } from 'date-fns/locale';

interface MonthSelectorProps {
  yearMonth: string;
  onChange: (yearMonth: string) => void;
}

export default function MonthSelector({ yearMonth, onChange }: MonthSelectorProps) {
  const date = parse(yearMonth, 'yyyy-MM', new Date());

  const handlePrev = () => {
    onChange(format(subMonths(date, 1), 'yyyy-MM'));
  };

  const handleNext = () => {
    onChange(format(addMonths(date, 1), 'yyyy-MM'));
  };

  return (
    <div className="month-selector">
      <button onClick={handlePrev}>&lt;</button>
      <span className="current-month">
        {format(date, 'yyyy년 M월', { locale: ko })}
      </span>
      <button onClick={handleNext}>&gt;</button>
    </div>
  );
}
