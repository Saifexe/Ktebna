const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="grid min-h-64 place-items-center rounded-lg border border-dashed bg-surface-soft p-8 text-center">
    <div>
      {Icon && <Icon className="mx-auto size-10 text-primary" />}
      <h2 className="mt-3 font-display text-xl font-bold">{title}</h2>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  </div>
);

export default EmptyState;
