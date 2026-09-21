const tones = {
  accent: "bg-accent text-accent-foreground",
  trust: "bg-trust-soft text-trust",
  muted: "bg-muted text-muted-foreground",
};

const Badge = ({ tone = "accent", className = "", children }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
