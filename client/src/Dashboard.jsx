import { useEffect, useState } from "react";
import api from "./api";
import "./Dashboard.css";

const money = (amount) =>
  `R${Number(amount || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return String(value._id || value.id || "");
};

function Dashboard({ user, services, onBackToMarketplace, onRefreshServices }) {
  const [activeSection, setActiveSection] = useState("Overview");

const [bookings, setBookings] = useState([]);
const [transactions, setTransactions] = useState([]);
const [totalIncome, setTotalIncome] = useState(0);

// Part 3 financial dashboard data
const [financialSummary, setFinancialSummary] = useState({
    grossIncome: 0,
    estimatedTax: 0,
    netIncome: 0,
    taxRate: 0.20,
    currency: "ZAR"
});

const [monthlyIncome, setMonthlyIncome] = useState([]);

const [incomeTransactionCount, setIncomeTransactionCount] = useState(0);

const [excludedFromIncomeCount, setExcludedFromIncomeCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [serviceError, setServiceError] = useState("");

  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    category: "Development",
    price: "",
    location: "",
  });

  const role = String(user?.role || "").toLowerCase();
  const isFreelancer = role === "freelancer";
  const isClient = role === "client";
  const userId = getId(user);

  const myServices = services.filter((service) => {
  const ownerId = getId(service.freelancer);
  return ownerId !== "" && ownerId === userId;
});

const eligibleTransactions = transactions.filter(
  (transaction) =>
    transaction.booking &&
    transaction.booking.status !== "cancelled"
);



  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      if (isClient) {
        const response = await api.get("/bookings/client");

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Could not load your bookings."
          );
        }

        setBookings(response.data.bookings || []);
        setTransactions([]);
        setTotalIncome(0);
      } else if (isFreelancer) {
        const results = await Promise.allSettled([
          api.get("/bookings/freelancer"),
          api.get("/bookings/freelancer/income"),
        ]);

        const bookingsResult = results[0];
        const incomeResult = results[1];

        if (bookingsResult.status === "fulfilled") {
          setBookings(bookingsResult.value.data.bookings || []);
        } else {
          setBookings([]);
        }

       if (incomeResult.status === "fulfilled") {

    const incomeData = incomeResult.value.data;

    const summary = incomeData.financialSummary || {};

    // Retrieve gross income.
    const grossIncome = Number(
        summary.grossIncome ??
        incomeData.totalIncome ??
        0
    );

    // Retrieve tax estimation rate.
    const taxRate = Number(
        summary.taxRate ??
        incomeData.taxRate ??
        0.20
    );

    // Retrieve estimated tax.
    const estimatedTax = Number(
        summary.estimatedTax ??
        incomeData.estimatedTax ??
        grossIncome * taxRate
    );

    // Retrieve net income.
    const netIncome = Number(
        summary.netIncome ??
        incomeData.netIncome ??
        grossIncome - estimatedTax
    );

    // Store transaction history.
    setTransactions(
        incomeData.transactions || []
    );

    // Preserve the existing overview income.
    setTotalIncome(grossIncome);

    // Store financial summary.
    setFinancialSummary({
        grossIncome,
        estimatedTax,
        netIncome,
        taxRate,
        currency: summary.currency || "ZAR"
    });

    // Store monthly income.
    setMonthlyIncome(
        Array.isArray(incomeData.monthlyIncome)
            ? incomeData.monthlyIncome
            : []
    );

    // Store eligible and excluded counts.
    setIncomeTransactionCount(
        Number(incomeData.incomeTransactionCount || 0)
    );

    setExcludedFromIncomeCount(
        Number(incomeData.excludedFromIncomeCount || 0)
    );

} else {

    setTransactions([]);
    setTotalIncome(0);

    setFinancialSummary({
        grossIncome: 0,
        estimatedTax: 0,
        netIncome: 0,
        taxRate: 0.20,
        currency: "ZAR"
    });

    setMonthlyIncome([]);
    setIncomeTransactionCount(0);
    setExcludedFromIncomeCount(0);
}

        if (
          bookingsResult.status === "rejected" &&
          incomeResult.status === "rejected"
        ) {
          throw new Error(
            "We couldn't load your bookings or earnings. Please try again."
          );
        }
      } else {
        setBookings([]);
        setTransactions([]);
        setTotalIncome(0);
        setFinancialSummary({
    grossIncome: 0,
    estimatedTax: 0,
    netIncome: 0,
    taxRate: 0.20,
    currency: "ZAR"
});

setMonthlyIncome([]);
setIncomeTransactionCount(0);
setExcludedFromIncomeCount(0);
      }

      
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userId, role]);

  const openCreateService = () => {
    setEditingService(null);
    setServiceForm({
      title: "",
      description: "",
      category: "Development",
      price: "",
      location: "",
    });
    setServiceError("");
    setServiceModalOpen(true);
  };

  const openEditService = (service) => {
    setEditingService(service);

    setServiceForm({
      title: service.title || "",
      description: service.description || "",
      category: service.category || "Development",
      price: String(service.price ?? ""),
      location: service.location || "",
    });

    setServiceError("");
    setServiceModalOpen(true);
  };

  const handleServiceInput = (event) => {
    const { name, value } = event.target;

    setServiceForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleServiceSubmit = async (event) => {
    event.preventDefault();

    setServiceError("");
    setNotice("");

    const price = Number(serviceForm.price);

    if (!Number.isFinite(price) || price <= 0) {
      setServiceError("Enter a valid price greater than zero.");
      return;
    }

    setServiceSubmitting(true);

    const payload = {
      title: serviceForm.title.trim(),
      description: serviceForm.description.trim(),
      category: serviceForm.category,
      price,
      location: serviceForm.location.trim(),
    };

    try {
      if (editingService) {
        await api.put(
          `/hustles/${editingService.id}`,
          payload
        );

        setNotice("Your service was updated successfully.");
      } else {
        await api.post("/hustles", payload);

        setNotice("Your service was created successfully.");
      }

      setServiceModalOpen(false);

      await onRefreshServices();
    } catch (err) {
      console.error("Service save error:", err);

      setServiceError(
        err.response?.data?.message ||
          "Unable to save the service. Please try again."
      );
    } finally {
      setServiceSubmitting(false);
    }
  };

  const handleDeleteService = async (service) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.title}"?`
    );

    if (!confirmed) return;

    setNotice("");
    setError("");

    try {
      await api.delete(`/hustles/${service.id}`);

      setNotice("Your service was deleted successfully.");

      await onRefreshServices();
    } catch (err) {
      console.error("Service deletion error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete this service."
      );
    }
  };

  const handleBookService = async (service) => {
    if (!isClient) {
      setNotice(
        "Only client accounts can book services. Log in with a client account to continue."
      );
      return;
    }

    const confirmed = window.confirm(
      `Book "${service.title}" for ${money(service.price)}?`
    );

    if (!confirmed) return;

    setNotice("");
    setError("");

    try {
      const response = await api.post("/bookings", {
        hustleId: service.id,
      });

      setNotice(
        response.data.message ||
          "Your booking was created successfully."
      );

      setActiveSection("Bookings");

      await loadDashboardData();
    } catch (err) {
      console.error("Booking creation error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to create this booking."
      );
    }
  };

  const handleCancelBooking = async (booking) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    setNotice("");
    setError("");

    try {
      const response = await api.patch(
        `/bookings/${booking._id}/cancel`
      );

      setNotice(
        response.data.message || "Booking cancelled successfully."
      );

      await loadDashboardData();
    } catch (err) {
      console.error("Booking cancellation error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to cancel this booking."
      );
    }
  };

  const sections = [
    "Overview",
    ...(isFreelancer ? ["My Services"] : []),
    "Bookings",
    ...(isFreelancer ? ["Earnings"] : []),
    "Profile",
  ];

  const activeBookings = bookings.filter(
    (booking) => booking.status !== "cancelled"
  );

  const renderOverview = () => (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">YOUR WORKSPACE</span>
          <h1>Welcome back, {user?.name || "Member"}.</h1>
          <p>Here's what's happening with your HustleHub+ account.</p>
        </div>

        <button
          className="dashboard-primary-button"
          onClick={
            isFreelancer
              ? openCreateService
              : onBackToMarketplace
          }
        >
          {isFreelancer ? "+ Create service" : "Explore services ↗"}
        </button>
      </div>

      <div className="dashboard-stat-grid">
        {isFreelancer && (
          <>
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">↗</span>
              <span className="dashboard-stat-label">My services</span>
              <strong>{myServices.length}</strong>
              <small>Listings you own</small>
            </article>

            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">▤</span>
              <span className="dashboard-stat-label">Total bookings</span>
              <strong>{bookings.length}</strong>
              <small>Bookings for your services</small>
            </article>

            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">R</span>
              <span className="dashboard-stat-label">Recorded income</span>
              <strong>{money(totalIncome)}</strong>
              <small>Simulated transaction records</small>
            </article>

            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">✓</span>
              <span className="dashboard-stat-label">Active bookings</span>
              <strong>{activeBookings.length}</strong>
              <small>Bookings not cancelled</small>
            </article>
          </>
        )}

        {isClient && (
          <>
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">▤</span>
              <span className="dashboard-stat-label">Total bookings</span>
              <strong>{bookings.length}</strong>
              <small>Your booking history</small>
            </article>

            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">✓</span>
              <span className="dashboard-stat-label">Active bookings</span>
              <strong>{activeBookings.length}</strong>
              <small>Bookings not cancelled</small>
            </article>

            <article className="dashboard-stat-card">
              <span className="dashboard-stat-icon">↗</span>
              <span className="dashboard-stat-label">Account type</span>
              <strong>Client</strong>
              <small>Ready to discover services</small>
            </article>
          </>
        )}

        {!isFreelancer && !isClient && (
          <article className="dashboard-stat-card">
            <span className="dashboard-stat-label">Account type</span>
            <strong>{role || "Unknown"}</strong>
            <small>Contact an administrator if this is incorrect.</small>
          </article>
        )}
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>Recent bookings</h2>
            <p>Your latest booking activity.</p>
          </div>

          <button
            className="dashboard-text-button"
            onClick={() => setActiveSection("Bookings")}
          >
            View all →
          </button>
        </div>

        {bookings.length === 0 ? (
          <div className="dashboard-empty">
            <span className="dashboard-empty-icon">▤</span>
            <h3>No bookings yet</h3>
            <p>
              {isFreelancer
                ? "Bookings for your services will appear here."
                : "Explore the marketplace and book a service to get started."}
            </p>

            {isClient && (
              <button
                className="dashboard-primary-button"
                onClick={onBackToMarketplace}
              >
                Explore marketplace
              </button>
            )}
          </div>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>{isFreelancer ? "Client" : "Freelancer"}</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {bookings.slice(0, 5).map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.hustle?.title || "Service"}</td>
                    <td>
                      {isFreelancer
                        ? booking.client?.name || "Client"
                        : booking.freelancer?.name || "Freelancer"}
                    </td>
                    <td>{money(booking.price)}</td>
                    <td>
                      <span
                        className={`dashboard-status status-${String(
                          booking.status || "unknown"
                        ).toLowerCase()}`}
                      >
                        {booking.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );

  const renderServices = () => (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">YOUR OFFERINGS</span>
          <h1>My Services</h1>
          <p>Manage the services you offer on HustleHub+.</p>
        </div>

        <button
          className="dashboard-primary-button"
          onClick={openCreateService}
        >
          + Create service
        </button>
      </div>

      {myServices.length === 0 ? (
        <div className="dashboard-panel dashboard-empty">
          <span className="dashboard-empty-icon">↗</span>
          <h3>You haven't listed a service yet.</h3>
          <p>
            Create your first listing to make your skills available to clients.
          </p>

          <button
            className="dashboard-primary-button"
            onClick={openCreateService}
          >
            Create your first service
          </button>
        </div>
      ) : (
        <div className="dashboard-service-grid">
          {myServices.map((service) => (
            <article className="dashboard-service-card" key={service.id}>
              <div className="dashboard-service-top">
                <span className="dashboard-category">
                  {service.category}
                </span>

                <span className="dashboard-service-price">
                  {money(service.price)}
                </span>
              </div>

              <h3>{service.title}</h3>
              <p>{service.description}</p>

              <div className="dashboard-service-location">
                {service.location || "Location not specified"}
              </div>

              <div className="dashboard-service-actions">
                <button
                  className="dashboard-secondary-button"
                  onClick={() => openEditService(service)}
                >
                  Edit
                </button>

                <button
                  className="dashboard-danger-button"
                  onClick={() => handleDeleteService(service)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );

  const renderBookings = () => (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">BOOKING MANAGEMENT</span>
          <h1>My Bookings</h1>
          <p>
            {isFreelancer
              ? "Review the bookings made for your services."
              : "Manage the services you have booked."}
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="dashboard-panel dashboard-empty">
          <span className="dashboard-empty-icon">▤</span>
          <h3>No bookings found</h3>
          <p>
            {isFreelancer
              ? "When a client books one of your services, it will appear here."
              : "Your bookings will appear here after you book a service."}
          </p>

          {isClient && (
            <button
              className="dashboard-primary-button"
              onClick={onBackToMarketplace}
            >
              Browse services
            </button>
          )}
        </div>
      ) : (
        <div className="dashboard-panel">
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>{isFreelancer ? "Client" : "Freelancer"}</th>
                  <th>Price</th>
                  <th>Status</th>
                  {isClient && <th>Action</th>}
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>
                      <strong>
                        {booking.hustle?.title || "Service"}
                      </strong>
                      <small className="dashboard-cell-subtitle">
                        {booking.hustle?.category || ""}
                      </small>
                    </td>

                    <td>
                      {isFreelancer
                        ? booking.client?.name || "Client"
                        : booking.freelancer?.name || "Freelancer"}
                    </td>

                    <td>{money(booking.price)}</td>

                    <td>
                      <span
                        className={`dashboard-status status-${String(
                          booking.status || "unknown"
                        ).toLowerCase()}`}
                      >
                        {booking.status || "Unknown"}
                      </span>
                    </td>

                    {isClient && (
                      <td>
                        {booking.status !== "cancelled" ? (
                          <button
                            className="dashboard-danger-button"
                            onClick={() =>
                              handleCancelBooking(booking)
                            }
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="dashboard-muted">
                            Cancelled
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

 // ============================================
// PART 3 - FINANCIAL DASHBOARD
// ============================================

const maxMonthlyIncome = Math.max(
    1,
    ...monthlyIncome.map(
        (month) => Number(month.income || 0)
    )
);

const renderEarnings = () => (
    <>

        {/* FINANCIAL HEADING */}

        <div className="dashboard-heading">

            <div>
                <span className="dashboard-eyebrow">
                    FINANCIAL OVERVIEW
                </span>

                <h1>Your Financial Overview</h1>

                <p>
                    Track your income, estimated tax and net earnings.
                </p>
            </div>

            <button
                className="dashboard-secondary-button"
                onClick={loadDashboardData}
            >
                Refresh earnings
            </button>

        </div>


        {/* FINANCIAL SUMMARY CARDS */}

        <div className="dashboard-stat-grid earnings-stat-grid">

            <article className="dashboard-stat-card earnings-highlight">

                <span className="dashboard-stat-icon">R</span>

                <span className="dashboard-stat-label">
                    Gross income
                </span>

                <strong>
                    {money(financialSummary.grossIncome)}
                </strong>

                <small>
                    {incomeTransactionCount} eligible transaction(s)
                </small>

            </article>


            <article className="dashboard-stat-card earnings-tax-card">

                <span className="dashboard-stat-icon">%</span>

                <span className="dashboard-stat-label">
                    Estimated tax
                </span>

                <strong>
                    {money(financialSummary.estimatedTax)}
                </strong>

                <small>
                    Based on a configured{" "}
                    {(financialSummary.taxRate * 100).toFixed(1)}% estimate
                </small>

            </article>


            <article className="dashboard-stat-card earnings-net-card">

                <span className="dashboard-stat-icon">✓</span>

                <span className="dashboard-stat-label">
                    Net income
                </span>

                <strong>
                    {money(financialSummary.netIncome)}
                </strong>

                <small>
                    Income after estimated tax
                </small>

            </article>

        </div>


        {/* MONTHLY INCOME CHART */}

        <section className="dashboard-panel">

            <div className="dashboard-panel-heading">

                <div>
                    <h2>Monthly income</h2>

                    <p>
                        Eligible gross income over the most recent six months.
                    </p>
                </div>

            </div>


            {monthlyIncome.length === 0 ? (

                <div className="dashboard-empty">
                    <h3>No monthly data available</h3>

                    <p>
                        Monthly income summaries will appear here.
                    </p>
                </div>

            ) : (

                <div
                    className="dashboard-monthly-chart"
                    role="list"
                    aria-label="Monthly income chart"
                >

                    {monthlyIncome.map((month) => {

                        const value = Number(month.income || 0);

                        const height = value > 0
                            ? Math.max(
                                4,
                                (value / maxMonthlyIncome) * 100
                            )
                            : 0;

                        return (

                            <div
                                className="dashboard-monthly-chart-item"
                                key={`${month.year}-${month.month}`}
                                role="listitem"
                            >

                                <strong className="dashboard-monthly-chart-value">
                                    {money(value)}
                                </strong>

                                <div
                                    className="dashboard-monthly-chart-track"
                                    aria-label={`${month.label}: ${money(value)}`}
                                >

                                    <div
                                        className="dashboard-monthly-chart-bar"
                                        style={{
                                            height: `${height}%`
                                        }}
                                    />

                                </div>

                                <span>
                                    {month.label}
                                </span>

                            </div>

                        );
                    })}

                </div>

            )}

        </section>


        {/* TRANSACTION SUMMARY */}

        <section className="dashboard-panel">

            <div className="dashboard-panel-heading">

                <div>
                    <h2>Transaction history</h2>

                    <p>
                        Historical transactions associated with your services.
                    </p>

                    <p>
                        {transactions.length} historical record(s) ·{" "}
                        {incomeTransactionCount} included ·{" "}
                        {excludedFromIncomeCount} excluded
                    </p>

                </div>

            </div>


            {transactions.length === 0 ? (

                <div className="dashboard-empty">

                    <h3>No transactions yet</h3>

                    <p>
                        Transaction records will appear after clients book
                        your services.
                    </p>

                </div>

            ) : (

                <div className="dashboard-table-wrapper">

                    <table className="dashboard-table">

                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Client</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>


                        <tbody>

                            {transactions.map((transaction) => {

                                const bookingCancelled =
                                    transaction.booking?.status === "cancelled";

                                const bookingUnavailable =
                                    !transaction.booking;

                                const excluded =
                                    bookingCancelled || bookingUnavailable;

                                const transactionLabel = bookingCancelled
                                    ? "Cancelled - excluded"
                                    : bookingUnavailable
                                        ? "Unavailable - excluded"
                                        : "Simulated - included";

                                return (

                                    <tr key={transaction._id}>

                                        <td>
                                            {transaction.hustle?.title || "Service"}
                                        </td>

                                        <td>
                                            {transaction.client?.name || "Client"}
                                        </td>

                                        <td>
                                            {money(transaction.amount)}
                                        </td>

                                        <td>

                                            <span
                                                className={`dashboard-status ${
                                                    excluded
                                                        ? "status-cancelled"
                                                        : "status-confirmed"
                                                }`}
                                            >
                                                {transactionLabel}
                                            </span>

                                        </td>

                                        <td>
                                            {transaction.createdAt
                                                ? new Date(
                                                    transaction.createdAt
                                                ).toLocaleDateString("en-ZA")
                                                : "—"}
                                        </td>

                                    </tr>

                                );
                            })}

                        </tbody>

                    </table>

                </div>

            )}


            <div className="dashboard-financial-note">

                <p>
                    Estimated tax uses the configurable tax estimation
                    rate. It is an illustrative estimate, not an official
                    tax assessment or professional tax advice.
                </p>

                <p>
                    Transactions represent simulated records and do not
                    represent verified payments from a payment provider.
                    Cancelled bookings are excluded from eligible income.
                </p>

            </div>

        </section>

    </>
);

  const renderProfile = () => (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-eyebrow">ACCOUNT SETTINGS</span>
          <h1>My Profile</h1>
          <p>Your HustleHub+ account information.</p>
        </div>
      </div>

      <section className="dashboard-panel dashboard-profile">
        <div className="dashboard-profile-avatar">
          {(user?.name || "U")
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>

        <div className="dashboard-profile-details">
          <h2>{user?.name || "User"}</h2>
          <p>{user?.email || "No email available"}</p>

          <span className="dashboard-role-badge">
            {role || "Member"}
          </span>
        </div>

        <div className="dashboard-profile-info">
          <div>
            <span>Full name</span>
            <strong>{user?.name || "Not available"}</strong>
          </div>

          <div>
            <span>Email address</span>
            <strong>{user?.email || "Not available"}</strong>
          </div>

          <div>
            <span>Account role</span>
            <strong>{role || "Not available"}</strong>
          </div>
        </div>

        <p className="dashboard-financial-note">
          Profile editing is not included yet. This page displays the account
          information currently available to the application.
        </p>
      </section>
    </>
  );

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <button
          className="dashboard-brand"
          onClick={onBackToMarketplace}
        >
          HustleHub<span>+</span>
        </button>

        <div className="dashboard-sidebar-label">WORKSPACE</div>

        <nav className="dashboard-nav">
          {sections.map((section) => (
            <button
              key={section}
              className={`dashboard-nav-item ${
                activeSection === section ? "active" : ""
              }`}
              onClick={() => {
                setActiveSection(section);
                setNotice("");
                setError("");
              }}
            >
              <span className="dashboard-nav-indicator">
                {section === "Overview"
                  ? "⌂"
                  : section === "My Services"
                    ? "↗"
                    : section === "Bookings"
                      ? "▤"
                      : section === "Earnings"
                        ? "R"
                        : "○"}
              </span>

              {section}
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-sidebar-user">
            <div className="dashboard-mini-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user?.name || "Member"}</strong>
              <span>{role || "User"}</span>
            </div>
          </div>

          <button
            className="dashboard-back-button"
            onClick={onBackToMarketplace}
          >
            ← Back to marketplace
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="dashboard-topbar-label">
              HUSTLEHUB+ / WORKSPACE
            </span>
          </div>

          <button
            className="dashboard-topbar-profile"
            onClick={() => setActiveSection("Profile")}
          >
            <span className="dashboard-mini-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </span>

            <span>{user?.name || "Member"}</span>
          </button>
        </header>

        <div className="dashboard-content">
          {notice && (
            <div className="dashboard-alert dashboard-alert-success">
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div className="dashboard-alert dashboard-alert-error">
              {error}
              <button
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {loading ? (
            <div className="dashboard-loading">
              <div className="dashboard-spinner"></div>
              <p>Loading your dashboard...</p>
            </div>
          ) : (
            <>
              {activeSection === "Overview" && renderOverview()}
              {activeSection === "My Services" && isFreelancer &&
                renderServices()}
              {activeSection === "Bookings" && renderBookings()}
              {activeSection === "Earnings" && isFreelancer &&
                renderEarnings()}
              {activeSection === "Profile" && renderProfile()}
            </>
          )}
        </div>
      </main>

      {serviceModalOpen && (
        <div
          className="dashboard-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !serviceSubmitting) {
              setServiceModalOpen(false);
            }
          }}
        >
          <section
            className="dashboard-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
          >
            <button
              className="dashboard-modal-close"
              onClick={() => setServiceModalOpen(false)}
              disabled={serviceSubmitting}
              aria-label="Close service form"
            >
              ×
            </button>

            <span className="dashboard-eyebrow">YOUR OFFERING</span>

            <h2 id="service-modal-title">
              {editingService ? "Edit service" : "Create a service"}
            </h2>

            <p>
              Tell clients what you offer and how much your service costs.
            </p>

            {serviceError && (
              <div className="dashboard-alert dashboard-alert-error">
                {serviceError}
              </div>
            )}

            <form
              className="dashboard-service-form"
              onSubmit={handleServiceSubmit}
            >
              <label htmlFor="service-title">Service title</label>
              <input
                id="service-title"
                name="title"
                value={serviceForm.title}
                onChange={handleServiceInput}
                minLength={3}
                maxLength={100}
                required
                placeholder="e.g. Website development"
              />

              <label htmlFor="service-description">Description</label>
              <textarea
                id="service-description"
                name="description"
                value={serviceForm.description}
                onChange={handleServiceInput}
                minLength={10}
                maxLength={2000}
                required
                rows={4}
                placeholder="Describe what the client will receive..."
              />

              <label htmlFor="service-category">Category</label>
              <select
                id="service-category"
                name="category"
                value={serviceForm.category}
                onChange={handleServiceInput}
                required
              >
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Writing">Writing</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>

              <label htmlFor="service-price">Price (ZAR)</label>
              <input
                id="service-price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={serviceForm.price}
                onChange={handleServiceInput}
                required
                placeholder="e.g. 500"
              />

              <label htmlFor="service-location">Location</label>
             <input
    id="service-location"
    name="location"
    value={serviceForm.location}
    onChange={handleServiceInput}
    minLength={2}
    maxLength={100}
    required
    placeholder="e.g. Pretoria or Remote"
/>

              <button
                className="dashboard-primary-button dashboard-form-submit"
                type="submit"
                disabled={serviceSubmitting}
              >
                {serviceSubmitting
                  ? "Saving..."
                  : editingService
                    ? "Save changes"
                    : "Publish service"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Dashboard;