import { Skeleton } from "@/components/ui/skeleton";

const PageSkeleton = () => {
  return (
    <div className="pt-32 md:pt-28 pb-12 px-6">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
