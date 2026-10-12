import { useEffect, useState } from "react";
import api from "./api";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import "./App.css";


const categories = [
  "All",
  "Development",
  "Design",
  "Writing",
  "Marketing",
];

const money = (amount) =>
  `R${Number(amount || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "client",
};

function App() {
  const [activeTab, setActiveTab] = useState("All");

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [formData, setFormData] = useState(emptyForm);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Load marketplace services from MongoDB
  const fetchHustles = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/hustles");

      if (!response.data.success) {
        throw new Error("Unable to retrieve marketplace services.");
      }

      const hustles = response.data.hustles || [];

 const formattedServices = hustles.map((hustle) => ({
  id: hustle._id,
  title: hustle.title,
  category: hustle.category,
  description: hustle.description,
  price: hustle.price,
  location: hustle.location,

  // Keep the freelancer's ID and display information consistent.
  freelancer:
    typeof hustle.createdBy === "object" && hustle.createdBy !== null
      ? {
          id: String(hustle.createdBy._id || hustle.createdBy.id || ""),
          name: hustle.createdBy.name || "",
          email: hustle.createdBy.email || "",
        }
      : {
          id: String(hustle.createdBy || ""),
          name: "",
          email: "",
        },

  initials: hustle.title
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
}));

      setServices(formattedServices);
    } catch (err) {
      console.error("Failed to load marketplace services:", err);

      setError(
        "We couldn't load the marketplace services. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHustles();
  }, []);

  // Restore an existing login when the page is refreshed
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("hustlehub_token");

      if (!token) {
        setAuthLoading(false);
        return;
      }

      let savedUser = null;

      try {
        savedUser = JSON.parse(
          localStorage.getItem("hustlehub_user") || "null"
        );
      } catch {
        savedUser = null;
      }

      try {
        const response = await api.get("/auth/me");

        if (!response.data.success) {
          throw new Error("Unable to restore your session.");
        }

        const authenticatedUser = response.data.user || {};

        setUser({
          ...savedUser,
          ...authenticatedUser,
          name: authenticatedUser.name || savedUser?.name || "",
          email: authenticatedUser.email || savedUser?.email || "",
          role: authenticatedUser.role || savedUser?.role || "",
        });
      } catch (err) {
        console.error("Session restoration failed:", err);

        localStorage.removeItem("hustlehub_token");
        localStorage.removeItem("hustlehub_user");
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Open login or registration
  const openAuth = (mode, role = "client") => {
    setAuthMode(mode);
    setFormData({
      ...emptyForm,
      role,
    });
    setAuthError("");
    setAuthSuccess("");
    setAuthOpen(true);
  };

  // Close the authentication modal
  const closeAuth = () => {
    if (authSubmitting) return;

    setAuthOpen(false);
    setAuthError("");
    setAuthSuccess("");
  };

  // Update form fields
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setAuthError("");
  };

  // Switch between login and registration
  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    setAuthError("");
    setAuthSuccess("");

    setFormData((previous) => ({
      ...previous,
      password: "",
    }));
  };

  // Submit login or registration
  const handleAuthSubmit = async (event) => {
    event.preventDefault();

    setAuthError("");
    setAuthSuccess("");
    setAuthSubmitting(true);

    try {
      if (authMode === "register") {
        const response = await api.post("/auth/register", {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role,
        });

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Registration failed."
          );
        }

        // Your backend does not return a token on registration.
        // Therefore, the user must log in after registering.
        setAuthMode("login");

        setFormData({
          ...emptyForm,
          email: formData.email.trim().toLowerCase(),
        });

        setAuthSuccess(
          "Account created successfully. Please log in."
        );
      } else {
        const response = await api.post("/auth/login", {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        });

        const { token, user: loggedInUser } = response.data;

        if (!response.data.success || !token || !loggedInUser) {
          throw new Error(
            response.data.message || "Login failed."
          );
        }

        // Store the JWT and user information
        localStorage.setItem("hustlehub_token", token);
        localStorage.setItem(
          "hustlehub_user",
          JSON.stringify(loggedInUser)
        );

        setUser(loggedInUser);
        setAuthOpen(false);
        setFormData(emptyForm);
        setAuthError("");
        setAuthSuccess("");
      }
    } catch (err) {
      console.error("Authentication error:", err);

      setAuthError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Log out the current user
 const handleLogout = () => {
  localStorage.removeItem("hustlehub_token");
  localStorage.removeItem("hustlehub_user");

  setUser(null);
  setShowDashboard(false);
  setAuthError("");
  setAuthSuccess("");
  setFormData(emptyForm);
};

  // Filter marketplace services
  const filteredServices =
    activeTab === "All"
      ? services
      : services.filter(
          (service) =>
            service.category?.toLowerCase() ===
            activeTab.toLowerCase()
        );

 return showDashboard && user ? (
  String(user.role || "").toLowerCase() === "admin" ? (
    <AdminDashboard
      user={user}
      onBackToMarketplace={() => setShowDashboard(false)}
      onLogout={handleLogout}
    />
  ) : (
    <Dashboard
      user={user}
      services={services}
      onBackToMarketplace={() => setShowDashboard(false)}
      onRefreshServices={fetchHustles}
    />
  )
): (
  <div className="app">
      {/* Navigation */}
      <header className="navbar">
        <a className="brand" href="#">
          HustleHub<span>+</span>
        </a>

        <nav className="nav-links">
          <a href="#marketplace">Explore</a>
          <a href="#how-it-works">How it works</a>
        </nav>

        <div className="nav-actions">
          {authLoading ? (
            <span className="auth-loading">Checking session...</span>
          ) : user ? (
            <>
              <span className="nav-user">
                Hi, {user.name || "Member"}
              </span>

              <button
                type="button"
                className="button button-primary"
                onClick={() => setShowDashboard(true)}
              >
                Dashboard
              </button>

              <button
                type="button"
                className="button button-outline"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="button button-outline"
                onClick={() => openAuth("login")}
              >
                Log in
              </button>

              <button
                type="button"
                className="button button-primary"
                onClick={() => openAuth("register")}
              >
                Get started
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        {/* Hero section */}
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              YOUR SKILLS. YOUR OPPORTUNITIES.
            </div>

            <h1>
              Turn your skills
              <br />
              into <span>opportunity.</span>
            </h1>

            <p>
              Connect with talented freelancers, discover new
              opportunities, and turn great ideas into real results.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="button button-primary button-large"
                onClick={() =>
                  document
                    .getElementById("marketplace")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Find a freelancer ↗
              </button>

              <button
                type="button"
                className="button button-outline button-large"
                onClick={() => openAuth("register", "freelancer")}
              >
                Start freelancing
              </button>
            </div>

            <div className="hero-note">
              A smarter way to work, create, and grow.
            </div>
          </div>

          <div className="hero-card">
            <div className="card-top">
              <span>THE FREELANCE ECONOMY</span>
              <span className="status-dot"></span>
            </div>

            <div className="hero-symbol">H+</div>

            <h2>Your next opportunity starts here.</h2>

            <p>
              Bring your talent to the table. Find work, build your
              reputation, and grow on your terms.
            </p>

            <div className="card-divider"></div>

            <div className="card-bottom">
              <span>BUILT FOR AMBITION</span>
              <span>01 / 03</span>
            </div>
          </div>
        </section>

        {/* Marketplace */}
        <section className="marketplace" id="marketplace">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THE MARKETPLACE</div>

              <h2>Explore what people do best.</h2>

              <p>
                Discover services from talented people ready to bring
                your ideas to life.
              </p>
            </div>

            <span className="service-count">
              {loading
                ? "LOADING..."
                : `${filteredServices.length} ${
                    filteredServices.length === 1
                      ? "SERVICE"
                      : "SERVICES"
                  }`}
            </span>
          </div>

          {/* Category filters */}
          <div className="category-tabs">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`category-tab ${
                  activeTab === category ? "active" : ""
                }`}
                onClick={() => setActiveTab(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="marketplace-message" role="status">
              <h3>Loading marketplace...</h3>
              <p>
                We're finding services available on HustleHub+.
              </p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="marketplace-message" role="alert">
              <h3>Something went wrong</h3>
              <p>{error}</p>

              <button
                type="button"
                className="button button-primary"
                onClick={fetchHustles}
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredServices.length === 0 && (
            <div className="marketplace-message">
              <h3>
                {services.length === 0
                  ? "No services available yet."
                  : "No services in this category."}
              </h3>

              <p>
                {services.length === 0
                  ? "Check back soon as freelancers add their services."
                  : "Choose another category to explore more services."}
              </p>

              {activeTab !== "All" && (
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setActiveTab("All")}
                >
                  View all services
                </button>
              )}
            </div>
          )}

          {/* Services retrieved from MongoDB */}
          {!loading && !error && filteredServices.length > 0 && (
            <div className="service-grid">
              {filteredServices.map((service) => (
                <article className="service-card" key={service.id}>
                  <div className="service-card-top">
                    <div className="service-icon">
                      {service.initials}
                    </div>

                    <span className="service-category">
                      {service.category}
                    </span>
                  </div>

                  <h3>{service.title}</h3>

                  <p>{service.description}</p>

                  <div className="service-location">
                    <span>Location</span>
                    <span>
                      {service.location || "Location not specified"}
                    </span>
                  </div>

                  <div className="service-freelancer">
                    <span>Offered by</span>
                    <span>
                      {service.freelancer?.name ||
                        "HustleHub freelancer"}
                    </span>
                  </div>

                  <div className="service-card-bottom">
                    <div>
                      <span className="starting-at">STARTING AT</span>

                      <strong>
                        R
                        {Number(service.price).toLocaleString("en-ZA")}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="arrow-button"
                      aria-label={`Book ${service.title}`}
                      title={
                        user?.role === "client"
                          ? "Book this service"
                          : "Log in as a client to book this service"
                      }
                      onClick={async () => {
                        if (!user) {
                          openAuth("login");
                          return;
                        }

                        if (user.role !== "client") {
                          window.alert(
                            "Only clients can book services. Please use a client account."
                          );
                          return;
                        }

                        const confirmed = window.confirm(
                          `Book ${service.title} for ${money(service.price)}?`
                        );

                        if (!confirmed) return;

                        try {
                          const response = await api.post("/bookings", {
                            hustleId: service.id,
                          });

                window.alert(
  response.data.message ||
    "Booking created successfully."
);

setShowDashboard(false);

// Open the dashboard after returning to the marketplace state.
// The dashboard will load the latest bookings when mounted.
setTimeout(() => {
  setShowDashboard(true);
}, 0);

                          setShowDashboard(true);
                        } catch (err) {
                          window.alert(
                            err.response?.data?.message ||
                              "Unable to create booking. Please try again."
                          );
                        }
                      }}
                    >
                      ↗
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="how-it-works" id="how-it-works">
          <div className="eyebrow">SIMPLE BY DESIGN</div>

          <h2>Good work starts with a connection.</h2>

          <div className="steps-grid">
            <article>
              <span>01</span>
              <h3>Discover</h3>
              <p>
                Explore services and find the right talent for your project.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>Connect</h3>
              <p>
                Choose a service and arrange the work you need done.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>Grow</h3>
              <p>
                Build relationships, deliver projects, and create opportunities.
              </p>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <a className="brand" href="#">
          HustleHub<span>+</span>
        </a>

        <p>Built for people who make things happen.</p>

        <span>© {new Date().getFullYear()} HustleHub+</span>
      </footer>

      {/* Authentication modal */}
      {authOpen && (
        <div
          className="auth-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAuth();
            }
          }}
        >
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
          >
            <button
              type="button"
              className="auth-close"
              onClick={closeAuth}
              aria-label="Close authentication form"
              disabled={authSubmitting}
            >
              ×
            </button>

            <div className="eyebrow">WELCOME TO HUSTLEHUB+</div>

            <h2 id="auth-title">
              {authMode === "login"
                ? "Welcome back."
                : "Create your account."}
            </h2>

            <p className="auth-description">
              {authMode === "login"
                ? "Log in to continue building opportunities."
                : "Join the marketplace and turn your skills into opportunity."}
            </p>

            {authError && (
              <div className="auth-message error" role="alert">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="auth-message success" role="status">
                {authSuccess}
              </div>
            )}

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <>
                  <label htmlFor="auth-name">Full name</label>

                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    minLength={2}
                    autoComplete="name"
                    required
                  />

                  <label htmlFor="auth-role">I want to join as a</label>

                  <select
                    id="auth-role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="client">Client</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                </>
              )}

              <label htmlFor="auth-email">Email address</label>

              <input
                id="auth-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="email"
                required
              />

              <label htmlFor="auth-password">Password</label>

              <input
                id="auth-password"
                name="password"
                type="password"
                placeholder={
                  authMode === "register"
                    ? "At least 8 characters"
                    : "Enter your password"
                }
                value={formData.password}
                onChange={handleInputChange}
                minLength={authMode === "register" ? 8 : undefined}
                autoComplete={
                  authMode === "register"
                    ? "new-password"
                    : "current-password"
                }
                required
              />

              <button
                type="submit"
                className="button button-primary auth-submit"
                disabled={authSubmitting}
              >
                {authSubmitting
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Log in"
                    : "Create account"}
              </button>
            </form>

            <div className="auth-switch">
              {authMode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchAuthMode("register")}
                    disabled={authSubmitting}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchAuthMode("login")}
                    disabled={authSubmitting}
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;