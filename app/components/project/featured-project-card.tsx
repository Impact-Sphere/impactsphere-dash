"use client";

import { useCurrency } from "@/app/components/currency/currency-context";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ProgressBar } from "@/app/components/ui/progress-bar";
import { getFundedPercent, getProjectImage } from "@/app/lib/project-utils";
import { cn } from "@/app/lib/utils";
import type { Project } from "@/app/types/project";

interface FeaturedProjectCardProps {
  project: Project;
  className?: string;
}

export function FeaturedProjectCard({
  project,
  className,
}: FeaturedProjectCardProps) {
  const { format } = useCurrency();
  const funded = getFundedPercent(project.currentAmount, project.targetBudget);

  return (
    <article
      className={cn(
        "col-span-12 lg:col-span-8 group relative overflow-hidden rounded-xl bg-surface-container-lowest transition-all hover:shadow-[0_32px_64px_-12px_rgba(69,0,173,0.12)]",
        className,
      )}
    >
      <div className="flex flex-col md:flex-row h-full">
        <div className="md:w-1/2 overflow-hidden relative min-h-[300px] md:min-h-0">
          {/* biome-ignore lint/performance/noImgElement: user-provided project images may be from any external host */}
          <img
            src={getProjectImage(project.image)}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
        <div className="md:w-1/2 p-10 flex flex-col justify-between">
          <div>
            <Badge variant="primary">{project.category}</Badge>
            <h3 className="text-3xl font-bold mt-4 leading-tight">
              {project.title}
            </h3>
            <p className="text-on-surface-variant text-sm mt-4 leading-relaxed">
              {project.description}
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-black text-primary">
                  {funded}%{" "}
                  <span className="text-sm font-medium text-on-surface-variant">
                    funded
                  </span>
                </span>
                <span className="text-sm font-bold">
                  {format(project.currentAmount)}{" "}
                  <span className="text-on-surface-variant font-normal">
                    of {format(project.targetBudget)}
                  </span>
                </span>
              </div>
              <ProgressBar value={funded} size="md" />
            </div>
            <a href={`/projects/${project.id}`}>
              <Button
                size="lg"
                className="shadow-xl shadow-primary/20 hover:translate-y-[-2px]"
              >
                Fund Now
              </Button>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
