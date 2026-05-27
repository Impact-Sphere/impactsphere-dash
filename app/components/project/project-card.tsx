"use client";

import { useCurrency } from "@/app/components/currency/currency-context";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ProgressBar } from "@/app/components/ui/progress-bar";
import { getFundedPercent, getProjectImage } from "@/app/lib/project-utils";
import { cn } from "@/app/lib/utils";
import type { Project } from "@/app/types/project";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const { format } = useCurrency();

  const getBadgeVariant = (category: string) => {
    switch (category) {
      case "Education":
        return "secondary";
      case "Healthcare":
        return "primary";
      case "Tech Equity":
        return "tertiary";
      default:
        return "primary";
    }
  };

  const funded = getFundedPercent(project.currentAmount, project.targetBudget);

  return (
    <article
      className={cn(
        "bg-surface-container-lowest rounded-xl p-8 flex flex-col hover:shadow-[0_32px_64px_-12px_rgba(69,0,173,0.08)] transition-all",
        className,
      )}
    >
      <div className="h-48 w-full rounded-xl overflow-hidden mb-6 relative">
        {/* biome-ignore lint/performance/noImgElement: user-provided project images may be from any external host */}
        <img
          src={getProjectImage(project.image)}
          alt={project.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant={getBadgeVariant(project.category)}>
          {project.category}
        </Badge>
        {project.approvalStatus && project.approvalStatus !== "APPROVED" && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              project.approvalStatus === "PENDING"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {project.approvalStatus === "PENDING" ? "Pending" : "Rejected"}
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold mt-3">{project.title}</h3>
      <p className="text-sm text-on-surface-variant mt-2 flex-1">
        {project.description}
      </p>
      <div className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-primary">{funded}%</span>
            <span className="text-on-surface-variant">
              {format(project.currentAmount)} / {format(project.targetBudget)}
            </span>
          </div>
          <ProgressBar value={funded} size="sm" />
        </div>
        <a href={`/projects/${project.id}`}>
          <Button variant="secondary" size="lg" className="w-full">
            Fund Now
          </Button>
        </a>
      </div>
    </article>
  );
}
