interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md rounded-lg border border-red-900/50 bg-red-950/30 p-6 text-center">
        <p className="text-sm font-medium text-red-300">Something went wrong</p>
        {message && <p className="mt-2 text-sm text-red-300/70">{message}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 rounded-md bg-red-900/50 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-900/80"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};
