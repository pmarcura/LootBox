"use client";

const XP_PER_LEVEL_BASE = 100;

/** Level from experience: floor(sqrt(experience/100)) + 1 */
export function levelFromExperience(experience: number): number {
  return Math.floor(Math.sqrt(experience / XP_PER_LEVEL_BASE)) + 1;
}

/** XP at start of level (level 1 = 0, level 2 = 100, level 3 = 400, ...) */
export function xpAtLevelStart(level: number): number {
  return (level - 1) ** 2 * XP_PER_LEVEL_BASE;
}

/** XP needed to reach next level from current experience */
export function xpToNextLevel(experience: number): number {
  const level = levelFromExperience(experience);
  return level ** 2 * XP_PER_LEVEL_BASE;
}

/** Progress 0..1 within current level */
export function experienceProgress(experience: number): number {
  const level = levelFromExperience(experience);
  const start = xpAtLevelStart(level);
  const end = level ** 2 * XP_PER_LEVEL_BASE;
  if (end <= start) return 1;
  return Math.min(1, (experience - start) / (end - start));
}

type ExperienceBarProps = {
  experience: number;
  className?: string;
  showLevel?: boolean;
  compact?: boolean;
};

export function ExperienceBar({
  experience,
  className = "",
  showLevel = true,
  compact = false,
}: ExperienceBarProps) {
  const level = levelFromExperience(experience);
  const progress = experienceProgress(experience);
  const nextLevelXp = level ** 2 * XP_PER_LEVEL_BASE;
  const currentLevelXp = (level - 1) ** 2 * XP_PER_LEVEL_BASE;
  const xpInLevel = experience - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;

  return (
    <div
      className={`flex items-center gap-2 ${compact ? "gap-1.5" : ""} ${className}`}
      title={`Nível ${level} · ${experience} XP`}
    >
      {showLevel && (
        <span
          className={`font-semibold text-violet-400 ${compact ? "text-xs" : "text-sm"}`}
          aria-hidden
        >
          Nv.{level}
        </span>
      )}
      <div
        className={`overflow-hidden rounded-full bg-zinc-800 ${compact ? "h-1.5 w-16" : "h-2 w-24"}`}
        role="progressbar"
        aria-valuenow={experience}
        aria-valuemin={currentLevelXp}
        aria-valuemax={nextLevelXp}
        aria-label={`Experiência: ${xpInLevel} de ${xpNeededForLevel} para o próximo nível`}
      >
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
