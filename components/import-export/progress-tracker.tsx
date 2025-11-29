"use client";

import { ImportProgress } from './types';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  FileText, 
  Search, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Database
} from 'lucide-react';

interface ProgressTrackerProps {
  progress: ImportProgress;
}

const TIMELINE_STAGES: Array<{ stage: ImportProgress['stage']; label: string }> = [
  { stage: 'reading', label: 'Reading' },
  { stage: 'parsing', label: 'Parsing' },
  { stage: 'grouping', label: 'Grouping' },
  { stage: 'checking', label: 'Checking' },
  { stage: 'importing', label: 'Importing' },
];

export function ProgressTracker({ progress }: ProgressTrackerProps) {
  const getIcon = () => {
    switch (progress.stage) {
      case 'reading':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'parsing':
        return <Search className="h-5 w-5 text-blue-600" />;
      case 'grouping':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'checking':
        return <Database className="h-5 w-5 text-blue-600" />;
      case 'importing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Loader2 className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBackgroundColor = () => {
    switch (progress.stage) {
      case 'complete':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTextColor = () => {
    switch (progress.stage) {
      case 'complete':
        return 'text-green-900 dark:text-green-100';
      case 'error':
        return 'text-red-900 dark:text-red-100';
      default:
        return 'text-blue-900 dark:text-blue-100';
    }
  };

  if (progress.stage === 'idle') {
    return null;
  }

  const currentStageIndex = progress.stage === 'complete' || progress.stage === 'error'
    ? TIMELINE_STAGES.length
    : Math.max(TIMELINE_STAGES.findIndex((item) => item.stage === progress.stage), 0);

  return (
    <div className={`border rounded-lg p-4 space-y-4 shadow-sm ${getBackgroundColor()}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold ${getTextColor()}`}>
              {getStageTitle(progress.stage)}
            </h4>
            <p className={`text-sm ${getTextColor()} opacity-90`}>
              {progress.message}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="hidden sm:flex items-center justify-between text-xs text-muted-foreground">
            {TIMELINE_STAGES.map((item, index) => {
              const isActive = index <= currentStageIndex;
              return (
                <div key={item.stage} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  <span className={isActive ? 'text-primary font-medium' : ''}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <Progress
            value={progress.progress}
            className="h-3 bg-muted/70 shadow-inner"
            indicatorClassName="bg-gradient-to-r from-primary via-purple-500 to-primary animate-progress-glow"
          />
          <p className="text-xs text-right text-muted-foreground">
            {Math.round(progress.progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}

function getStageTitle(stage: ImportProgress['stage']): string {
  switch (stage) {
    case 'reading':
      return 'Reading File';
    case 'parsing':
      return 'Parsing Data';
    case 'grouping':
      return 'Grouping Equipment';
    case 'checking':
      return 'Checking System';
    case 'importing':
      return 'Importing Data';
    case 'complete':
      return 'Import Complete';
    case 'error':
      return 'Import Failed';
    default:
      return 'Processing';
  }
}

