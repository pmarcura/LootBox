"use client";

import Image from "next/image";

type AvatarImageProps = {
  src: string | null | undefined;
  alt: string;
  size?: number;
  className?: string;
  referrerPolicy?: "no-referrer" | "no-referrer-when-downgrade" | "origin" | "origin-when-cross-origin" | "same-origin" | "strict-origin" | "strict-origin-when-cross-origin" | "unsafe-url";
};

/** Avatar otimizado com next/image (avatares de perfil, amigos, clã, duelos). */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = "",
  referrerPolicy,
}: AvatarImageProps) {
  if (!src) {
    return null;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`.trim()}
      sizes={`${size}px`}
      unoptimized={!isOptimizableUrl(src)}
      referrerPolicy={referrerPolicy}
    />
  );
}

function isOptimizableUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.endsWith(".supabase.co") || u.hostname.endsWith(".supabase.in");
  } catch {
    return false;
  }
}
