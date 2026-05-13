interface ExerciseImageProps {
  images: string[];
  className?: string;
}

export default function ExerciseImage({ images, className = "" }: ExerciseImageProps) {
  if (!images || images.length === 0) return null;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
  };

  if (images.length === 1) {
    return (
      <div className={`flex justify-center ${className}`}>
        <img
          src={images[0]}
          alt="Exercise demonstration"
          loading="lazy"
          onError={handleError}
          className="w-full h-auto object-cover rounded-lg max-h-96"
        />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {images.map((url, i) => (
        <img
          key={i}
          src={url}
          alt={`Exercise demonstration ${i + 1}`}
          loading="lazy"
          onError={handleError}
          className="w-full h-auto object-cover rounded-lg max-h-96"
        />
      ))}
    </div>
  );
}
