import { useContext } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { AuthContext } from "./AuthProvider";
import AuthForm from "./AuthForm";
import Spinner from "../ui/Spinner";

// Only follow same-site paths from ?next= (no protocol-relative "//host").
const safeNext = (next) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile");

const Login = () => {
  const { user, loading } = useContext(AuthContext);
  const [params] = useSearchParams();

  if (loading) return <Spinner className="py-24" />;
  if (user) return <Navigate to={safeNext(params.get("next"))} replace />;

  return (
    <div className="grid min-h-[75vh] place-items-center bg-surface-soft px-4 py-10">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <BookOpen className="mx-auto mb-3 size-8 text-primary" />
        <AuthForm />
      </div>
    </div>
  );
};

export default Login;
