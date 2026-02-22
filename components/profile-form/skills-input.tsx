"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SkillsInputProps {
  skills: string[];
  recommendedSkills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillsInput({
  skills,
  recommendedSkills,
  onChange,
}: SkillsInputProps) {
  const [input, setInput] = useState("");

  const skillsLower = useMemo(
    () => new Set(skills.map((s) => s.toLowerCase())),
    [skills]
  );

  const suggestions = useMemo(() => {
    return recommendedSkills.filter(
      (rs) => !skillsLower.has(rs.toLowerCase())
    );
  }, [recommendedSkills, skillsLower]);

  const addSkill = useCallback(
    (skill: string) => {
      const trimmed = skill.trim();
      if (trimmed && !skillsLower.has(trimmed.toLowerCase()) && skills.length < 50) {
        onChange([...skills, trimmed]);
      }
    },
    [skills, skillsLower, onChange]
  );

  const removeSkill = useCallback(
    (index: number) => {
      onChange(skills.filter((_, i) => i !== index));
    },
    [skills, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addSkill(input);
        setInput("");
      }
      if (e.key === "Backspace" && !input && skills.length > 0) {
        removeSkill(skills.length - 1);
      }
    },
    [input, skills.length, addSkill, removeSkill]
  );

  return (
    <div className="space-y-3">
      {/* Current skills */}
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, i) => {
          const isRecommended = recommendedSkills.some(
            (rs) => rs.toLowerCase() === skill.toLowerCase()
          );
          return (
            <Badge
              key={`${skill}-${i}`}
              variant={isRecommended ? "default" : "secondary"}
              className="cursor-pointer hover:opacity-70"
              onClick={() => removeSkill(i)}
            >
              {skill} &times;
            </Badge>
          );
        })}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={skills.length >= 50 ? "Max 50 skills" : "Type skill + Enter"}
          disabled={skills.length >= 50}
          className="min-w-[150px] flex-1 border-none bg-transparent px-1 py-1 text-sm outline-none"
        />
      </div>

      {/* Suggested skills */}
      {suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Recommended for {skills.length > 0 ? "you" : "this role"} (click to add):
          </p>
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 20).map((rs) => (
              <button
                key={rs}
                onClick={() => addSkill(rs)}
                className={cn(
                  "rounded-full border border-dashed px-2 py-0.5 text-xs transition-colors",
                  "text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5"
                )}
              >
                + {rs}
              </button>
            ))}
            {suggestions.length > 20 && (
              <span className="px-2 py-0.5 text-xs text-muted-foreground">
                +{suggestions.length - 20} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
