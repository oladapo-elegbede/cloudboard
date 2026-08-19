export const LoadingState = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white"></div>
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
};
