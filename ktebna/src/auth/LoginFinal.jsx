import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Login = () => {
  const { user, login, register, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate("/account/posts");
    }
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "register") {
        await register(form);
        toast.success("Account created!");
      } else {
        await login({ email: form.email, password: form.password });
        toast.success("Welcome back!");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="absolute inset-0 flex flex-col flex-1 justify-center items-center w-full sm:bg-[#f5f5f5] bg-white gap-6 bg-[radial-gradient(ellipse_at_top,rgba(120,53,15,0.08),transparent_50%),linear-gradient(to_bottom,#faf7f2,#f7f3ea)] text-stone-800 dark:bg-[linear-gradient(to_bottom,#0b0a09,#0d0c0a)]">
      {user ? null : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 w-full max-w-sm bg-white/70 p-6 rounded-2xl shadow-md border border-stone-200"
        >
          <h1 className="font-serif text-2xl text-center text-stone-900 mb-2">
            {mode === "login" ? "Log in" : "Create an account"}
          </h1>

          {mode === "register" && (
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange}
              required
              className="border rounded-xl px-3 py-2"
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="border rounded-xl px-3 py-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            className="border rounded-xl px-3 py-2"
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 px-5 py-2 rounded-xl bg-amber-700 text-amber-50 font-medium hover:bg-amber-800 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Sign up"}
          </button>

          <button
            type="button"
            onClick={() =>
              setMode(mode === "login" ? "register" : "login")
            }
            className="text-sm text-stone-600 hover:text-stone-900 mt-1"
          >
            {mode === "login"
              ? "No account yet? Sign up"
              : "Already have an account? Log in"}
          </button>
        </form>
      )}
    </div>
  );
};

export default Login;
