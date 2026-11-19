"use client";

import Image from "next/image";
import { useState } from "react";

const FALLBACK = "/images/products/img_0009.jpg";

type Props = {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  width?: number;
  height?: number;
};

export default function ProductImage({ src, alt, fill, className, sizes, width, height }: Props) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK);
  const [usedFallback, setUsedFallback] = useState(false);

  const handleError = () => {
    if (!usedFallback) {
      setUsedFallback(true);
      setImgSrc(FALLBACK);
    }
  };

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes ?? "150px"}
        unoptimized
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width ?? 150}
      height={height ?? 150}
      className={className}
      unoptimized
      onError={handleError}
    />
  );
}
