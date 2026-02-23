"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DepthLayer {
  image: string;
  depth: number;
}

export interface DepthCardProps {
  image?: string;
  title: string;
  description?: string;
  width?: number;
  height?: number;
  maxRotation?: number;
  maxTranslation?: number;
  borderRadius?: string;
  className?: string;
  contentClassName?: string;
  onClick?: () => void;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  imageAlt?: string;
  disableOnMobile?: boolean;
  ariaLabel?: string;
  layers?: DepthLayer[];
  staggerDelay?: number;
  revealAnimation?: "slide" | "fade" | "scale" | "none";
  respectReducedMotion?: boolean;
  spotlight?: boolean;
  spotlightColor?: string;
}

const DepthCard: React.FC<DepthCardProps> = ({
  image,
  title,
  description,
  width = 240,
  height = 320,
  maxRotation = 20,
  maxTranslation = 20,
  borderRadius = "16px",
  className,
  onClick,
  href,
  target = "_self",
  ariaLabel,
  disableOnMobile = false,
  layers,
  respectReducedMotion = true,
  spotlight = true,
  spotlightColor = "rgba(255, 255, 255, 0.5)",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const targetRef = useRef({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  const currentRef = useRef({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
  const rafId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!disableOnMobile) return;
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ) || window.innerWidth < 768,
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [disableOnMobile]);

  useEffect(() => {
    if (!respectReducedMotion) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    handler({ matches: mediaQuery.matches } as MediaQueryListEvent);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [respectReducedMotion]);

  const shouldDisableEffects =
    (disableOnMobile && isMobile) || prefersReducedMotion;

  useEffect(() => {
    if (shouldDisableEffects) return;

    const lerp = (start: number, end: number, factor: number) =>
      start + (end - start) * factor;

    const animate = () => {
      const t = targetRef.current;
      const c = currentRef.current;

      c.x = lerp(c.x, t.x, 0.1);
      c.y = lerp(c.y, t.y, 0.1);
      c.rotateX = lerp(c.rotateX, t.rotateX, 0.1);
      c.rotateY = lerp(c.rotateY, t.rotateY, 0.1);

      if (innerRef.current) {
        innerRef.current.style.transform = `rotateX(${c.rotateX}deg) rotateY(${c.rotateY}deg)`;
      }

      if (layers && layers.length > 0) {
        layerRefs.current.forEach((layer, index) => {
          if (layer) {
            const depth = layers[index].depth;
            layer.style.transform = `translateX(${c.x * depth}px) translateY(${c.y * depth}px) scale(1.3)`;
          }
        });
      } else if (layerRefs.current[0]) {
        layerRefs.current[0].style.transform = `translateX(${c.x}px) translateY(${c.y}px) scale(1.3)`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [shouldDisableEffects, layers]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement | HTMLAnchorElement>) => {
      if (!cardRef.current || shouldDisableEffects) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      if (spotlight && spotlightRef.current) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        spotlightRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, ${spotlightColor} 0%, rgba(255, 255, 255, 0.1) 40%, transparent 100%)`;
      }

      const percentX = mouseX / (rect.width / 2);
      const percentY = mouseY / (rect.height / 2);

      targetRef.current = {
        x: percentX * -maxTranslation,
        y: percentY * -maxTranslation,
        rotateX: percentY * -maxRotation,
        rotateY: percentX * maxRotation,
      };
    },
    [maxRotation, maxTranslation, shouldDisableEffects, spotlight, spotlightColor],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = "1";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    targetRef.current = { x: 0, y: 0, rotateX: 0, rotateY: 0 };
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = "0";
    }
  }, []);

  const handleClick = useCallback(() => {
    if (href) {
      if (target === "_blank") {
        window.open(href, target, "noopener,noreferrer");
      } else {
        window.location.href = href;
      }
    }
    onClick?.();
  }, [href, target, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement | HTMLAnchorElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <div
      ref={cardRef}
      className={cn("relative cursor-pointer focus:outline-none", className)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        perspective: "1000px",
        borderRadius,
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick && !href ? handleClick : undefined}
      onKeyDown={onClick || href ? handleKeyDown : undefined}
      role={onClick || href ? "button" : undefined}
      tabIndex={onClick || href ? 0 : undefined}
      aria-label={ariaLabel || `${title} card`}
    >
      <div
        ref={innerRef}
        className={cn(
          "relative w-full h-full bg-provn-surface",
          "transition-shadow duration-300 ease-out",
        )}
        style={{
          borderRadius,
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          willChange: "transform",
          clipPath: `inset(0 round ${borderRadius})`,
          boxShadow: isHovered
            ? "0 20px 40px rgba(0,0,0,0.4)"
            : "0 10px 20px rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ borderRadius }}
        >
          {layers && layers.length > 0 ? (
            layers.map((layer, index) => (
              <div
                key={index}
                ref={(el) => {
                  layerRefs.current[index] = el;
                }}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                  backgroundImage: `url(${layer.image})`,
                  zIndex: index,
                  opacity: index === 0 ? 1 : 0.6,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              />
            ))
          ) : (
            <div
              ref={(el) => {
                layerRefs.current[0] = el;
              }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
              style={{
                backgroundImage: `url(${image})`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            />
          )}
        </div>

        {spotlight && (
          <div
            ref={spotlightRef}
            className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-300 ease-out opacity-0"
            style={{
              mixBlendMode: "soft-light",
              filter: "blur(2px)",
            }}
          />
        )}

        <div className="absolute inset-0 z-30 flex flex-col justify-end p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <h3
            className={cn(
              "text-2xl font-bold text-white mb-2 transform transition-all duration-500",
              isHovered
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-90",
            )}
          >
            {title}
          </h3>
          {description && (
            <p
              className={cn(
                "text-sm text-gray-200 transform transition-all duration-500 delay-75",
                isHovered
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0",
              )}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

DepthCard.displayName = "DepthCard";

export default DepthCard;
