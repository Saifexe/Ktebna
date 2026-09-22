import { mediaUrl } from "../apiClient";

// Profile picture with an initial-letter fallback (most accounts have none).
const Avatar = ({ src, name, className = "size-10", ring = false }) => {
  const ringCls = ring ? "border-2 border-primary/30" : "";
  if (src) {
    return (
      <img
        src={mediaUrl(src)}
        alt={name || ""}
        className={`${className} ${ringCls} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${className} ${ringCls} grid shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground`}
    >
      {name?.trim()?.charAt(0)?.toUpperCase() || "?"}
    </span>
  );
};

export default Avatar;
