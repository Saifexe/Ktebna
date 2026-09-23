// A number over a small label, as in the profile header's stats strip.
const Stat = ({ n, label }) => (
  <div>
    <b className="text-primary">{n}</b>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

export default Stat;
