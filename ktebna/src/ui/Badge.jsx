const tones = {
  accent: "bg-accent text-accent-foreground",
  trust: "bg-trust-soft text-trust",
  muted: "bg-muted text-muted-foreground",
  reserved: "bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100",
  sold: "bg-foreground text-background",
};

const Badge = ({ tone = "accent", className = "", children }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
