import "./App.css";
import heroImage from "./assets/hero.png";

function App() {
  return (
    <main className="login-page">
      <section className="login-card" aria-label="Login">
        <div className="login-panel">
          <h1>WELCOME BACK</h1>
          <p>Welcome back! Please enter your details.</p>

          <form className="login-form" action="#">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="Enter your email" />

            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="*********" />

            <div className="login-row">
              <label className="remember-wrap" htmlFor="remember">
                <input id="remember" type="checkbox" />
                <span>Remember me</span>
              </label>
              <button type="button" className="text-btn">
                Forgot password
              </button>
            </div>

            <button type="button" className="primary-btn">
              Sign in
            </button>

            <button type="button" className="google-btn">
              <span className="google-icon" aria-hidden="true">
                G
              </span>
              <span>Sign in with Google</span>
            </button>

            <p className="signup-text">
              Don’t have an account? <span>Sign up to free!</span>
            </p>
          </form>
        </div>

        <div className="art-panel" aria-hidden="true">
          <img src={heroImage} alt="" />
        </div>
      </section>
    </main>
  );
}

export default App
