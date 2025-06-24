import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav>
      <button onClick={() => navigate("/sign-in")}>Login</button>
      <button onClick={() => navigate("/sign-up")}>Sign Up</button>
    </nav>
  );
}
