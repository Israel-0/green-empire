interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md';
}

export default function ProgressBar({
  value,
  max = 100,
  color = '#4ade80',
  label,
  showPercent = false,
  size = 'md',
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs mb-1">
          {label && <span className="text-grow-muted">{label}</span>}
          {showPercent && <span className="text-grow-white">{percent.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`progress-bar ${height}`}>
        <div
          className="progress-fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
