"use client";

import Image from "next/image";

type CardImageProps = {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  /** Preencher o container (parent com position: relative). */
  fill?: boolean;
  className?: string;
  /** object-fit para arte de criatura/carta: "contain" = nada cortado; "cover" = preencher (pode recortar). */
  objectFit?: "contain" | "cover";
  /** Conteúdo quando não há imagem (ex.: stats da carta) */
  children?: React.ReactNode;
};

/** Usa next/image para arte de cartas: otimização e menos memória no mobile. */
export function CardImage({
  src,
  alt,
  width = 160,
  height = 224,
  fill = false,
  className = "",
  objectFit = "cover",
  children,
}: CardImageProps) {
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover object-center";
  const combinedClassName = [className, fitClass].filter(Boolean).join(" ");

  if (!src) {
    return <div className={fill ? "h-full w-full " + className : className}>{children}</div>;
  }
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={combinedClassName}
        sizes="(max-width: 640px) 88px, 160px"
        unoptimized={!isOptimizableUrl(src)}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={combinedClassName}
      sizes="(max-width: 640px) 88px, 160px"
      unoptimized={!isOptimizableUrl(src)}
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
