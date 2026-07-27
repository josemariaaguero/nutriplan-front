import { useEffect, useState, type CSSProperties } from 'react';
import { fetchRecipeMealImage, resolveMealImage } from '../mealImages';
import type { Meal } from '../types';

type Props = {
  meal: Pick<Meal, 'swatch' | 'image' | 'emoji' | 'name' | 'slot'>;
  size?: number;
  radius?: number;
  showEmoji?: boolean;
  style?: CSSProperties;
};

/** Compact meal image: recipe API photo when available, else Unsplash fallback. */
export default function MealThumb({
  meal,
  size = 62,
  radius = 16,
  showEmoji = true,
  style,
}: Props) {
  const fallback = resolveMealImage(meal.name || '', meal.slot, meal.image);
  const [photo, setPhoto] = useState(fallback);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPhoto(fallback);
    setFailed(false);
    setReady(false);
  }, [fallback]);

  useEffect(() => {
    const name = meal.name || '';
    if (!name) return;
    let cancelled = false;
    fetchRecipeMealImage(name).then(url => {
      if (!cancelled && url) {
        setPhoto(url);
        setFailed(false);
        setReady(false);
      }
    });
    return () => { cancelled = true; };
  }, [meal.name]);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: meal.swatch,
        backgroundSize: 'cover',
        contain: 'layout paint style',
        ...style,
      }}
    >
      {!failed && (
        <img
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          className={`np-thumb-img ${ready ? 'is-ready' : 'is-loading'}`}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
      {showEmoji && failed && (
        <div style={{
          position: 'absolute', bottom: 5, left: 6, fontSize: size > 70 ? 28 : 18,
        }}>
          {meal.emoji}
        </div>
      )}
    </div>
  );
}
