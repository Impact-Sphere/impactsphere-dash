"use client";

import { useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import { useCurrency } from "@/app/components/currency/currency-context";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ProgressBar } from "@/app/components/ui/progress-bar";
import { authClient } from "@/app/lib/auth-client";
import { getFundedPercent, getProjectImage } from "@/app/lib/project-utils";
import { cn } from "@/app/lib/utils";
import type { Project } from "@/app/types/project";

interface ProjectCardProps {
  project: Project;
  className?: string;
  transparentWhenNotFavorite?: boolean;
}

export function ProjectCard({
  project,
  className,
  transparentWhenNotFavorite = false,
}: ProjectCardProps) {
  const { format } = useCurrency();
  const { data: session } = authClient.useSession();

  const [isFavorited, setIsFavoritedLocal] = useState(!!project.isFavorited);

  const onFavoriteToggle = async () => {
    const res = await fetch("/api/projects/favorites", {
      method: isFavorited ? "DELETE" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });
    if (!res.ok) throw Error("Failed to toggle favorite");
    setIsFavoritedLocal(!isFavorited);
  };

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
        "bg-surface-container-lowest rounded-xl p-5 sm:p-6 lg:p-8 flex flex-col hover:shadow-[0_32px_64px_-12px_rgba(69,0,173,0.08)] transition-all",
        className,
      )}
      style={{
        opacity: transparentWhenNotFavorite && !isFavorited ? 0.35 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      <div className="h-44 sm:h-48 w-full rounded-xl overflow-hidden mb-5 sm:mb-6 relative group">
        {/* biome-ignore lint/performance/noImgElement: user-provided project images may be from any external host */}
        <img
          src={getProjectImage(project.image)}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        {session?.user && (
          <button
            type="button"
            onClick={onFavoriteToggle}
            aria-label={
              isFavorited ? "Remove from favorites" : "Add to favorites"
            }
            aria-pressed={isFavorited}
            className="
            absolute top-3 right-3
            bg-white/80 backdrop-blur
            p-3 rounded-full
            shadow-md
            opacity-70 group-hover:opacity-100 focus-visible:opacity-100
            transition-opacity
            hover:scale-110
          "
          >
            {isFavorited ? (
              <FaStar className="text-yellow-500" />
            ) : (
              <FaRegStar className="text-gray-600" />
            )}
          </button>
        )}
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
      <h3 className="text-lg sm:text-xl font-bold mt-3">{project.title}</h3>
      <p className="text-sm text-on-surface-variant mt-2 flex-1">
        {project.description}
      </p>
      <div className="mt-6 sm:mt-8 space-y-4">
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
