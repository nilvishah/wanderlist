import { useState } from "react";
import type { ColorFamily, Scene } from "../lib/types";
import SceneIllustration from "./SceneIllustration";

interface Props {
  seed: string;
  scene: Scene;
  color: ColorFamily | string;
  photoUrl?: string | null;
  className?: string;
  alt?: string;
}

// Shows the place photo if there is one, with the illustration
// underneath as the loading state and fallback.
export default function PlaceMedia({ seed, scene, color, photoUrl, className = "", alt = "" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <SceneIllustration scene={scene} color={color} seed={seed} className="absolute inset-0 w-full h-full" />
      {photoUrl && !failed && (
        <img
          key={photoUrl}
          src={photoUrl}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}