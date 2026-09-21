import { Loader2 } from "lucide-react";

const Spinner = ({ className = "" }) => (
  <div className={`flex justify-center p-10 text-primary ${className}`}>
    <Loader2 className="size-7 animate-spin" />
  </div>
);

export default Spinner;
