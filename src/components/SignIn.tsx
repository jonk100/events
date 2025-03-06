import { useState } from "react";
import { signIn, signUp } from "../lib/auth";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password);
        alert("Check your email for confirmation!");
      } else {
        await signIn(email, password);
        alert("Signed in successfully!");
      }
    } catch (error: any) {
      alert(error.message);
    }
  }

  return (
    <div>
      <h2>{isSignUp ? "Sign Up" : "Sign In"}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">{isSignUp ? "Sign Up" : "Sign In"}</button>
      </form>
      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? "Already have an account? Sign In" : "No account? Sign Up"}
      </button>
    </div>
  );
}
