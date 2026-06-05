import { cn } from "@/app/lib/utils";

interface ProjectCardSkeletonProps {
  className?: string;
}

export function ProjectCardSkeleton({ className }: ProjectCardSkeletonProps) {
  return (
    <article
      className={cn(
        "bg-surface-container-lowest rounded-xl p-5 sm:p-6 lg:p-8 flex flex-col animate-pulse",
        className,
      )}
    >
      <div className="h-44 sm:h-48 w-full rounded-xl bg-surface-container mb-5 sm:mb-6" />
      <div className="flex items-center space-x-2">
        <div className="h-6 w-20 bg-surface-container rounded-full" />
      </div>
      <div className="h-7 w-3/4 bg-surface-container rounded-lg mt-3" />
      <div className="space-y-2 mt-2 flex-1">
        <div className="h-4 w-full bg-surface-container rounded" />
        <div className="h-4 w-5/6 bg-surface-container rounded" />
        <div className="h-4 w-4/6 bg-surface-container rounded" />
      </div>
      <div className="mt-6 sm:mt-8 space-y-4">
        <div className="h-4 w-full bg-surface-container rounded-full" />
        <div className="h-12 w-full bg-surface-container rounded-xl" />
      </div>
    </article>
  );
}
