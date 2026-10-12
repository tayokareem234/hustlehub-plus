import { useCallback, useEffect, useState } from "react";
import api from "./api";

function AdminDashboard({ user, onBackToMarketplace, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/users");

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to retrieve users."
        );
      }

      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load registered users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const countByRole = (role) =>
    users.filter(
      (account) =>
        String(account.role || "").toLowerCase() === role
    ).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f6fa",
        color: "#172033",
        padding: "32px 20px",
        fontFamily: "inherit",
      }}
    >
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div>
            <p
              style={{
                color: "#5969a8",
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "2px",
                marginBottom: "8px",
              }}
            >
              HUSTLEHUB+ ADMINISTRATION
            </p>

            <h1 style={{ margin: "0 0 8px" }}>
              Administrator Dashboard
            </h1>

            <p style={{ color: "#657087", margin: 0 }}>
              Welcome, {user?.name || "Administrator"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={onBackToMarketplace}
              style={buttonStyle}
            >
              Back to marketplace
            </button>

            <button
              type="button"
              onClick={onLogout}
              style={buttonStyle}
            >
              Log out
            </button>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {[
            ["Total users", users.length],
            ["Clients", countByRole("client")],
            ["Freelancers", countByRole("freelancer")],
            ["Administrators", countByRole("admin")],
          ].map(([label, value]) => (
            <article key={label} style={cardStyle}>
              <p style={{ color: "#657087", marginTop: 0 }}>
                {label}
              </p>

              <strong style={{ fontSize: "30px" }}>
                {value}
              </strong>
            </article>
          ))}
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 8px" }}>
                Registered users
              </h2>

              <p style={{ color: "#657087", margin: 0 }}>
                View registered accounts and their assigned roles.
              </p>
            </div>

            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              style={buttonStyle}
            >
              {loading ? "Loading..." : "Refresh users"}
            </button>
          </div>

          {loading && (
            <p role="status">Loading registered users...</p>
          )}

          {error && (
            <div
              role="alert"
              style={{
                background: "#fff0f0",
                color: "#9d2424",
                padding: "14px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <p>No registered users were found.</p>
          )}

          {!loading && !error && users.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "600px",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr>
                    {["Name", "Email", "Role", "Date registered"].map(
                      (heading) => (
                        <th key={heading} style={cellStyle}>
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {users.map((account) => (
                    <tr key={account._id}>
                      <td style={cellStyle}>{account.name}</td>
                      <td style={cellStyle}>{account.email}</td>
                      <td style={cellStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 10px",
                            borderRadius: "20px",
                            background: "#eef0ff",
                            fontSize: "13px",
                          }}
                        >
                          {account.role}
                        </span>
                      </td>
                      <td style={cellStyle}>
                        {account.createdAt
                          ? new Date(
                              account.createdAt
                            ).toLocaleDateString("en-ZA")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p
            style={{
              fontSize: "13px",
              color: "#657087",
              marginTop: "22px",
            }}
          >
            User oversight is read-only. Password hashes are not
            displayed by this dashboard.
          </p>
        </section>
      </div>
    </main>
  );
}

const buttonStyle = {
  padding: "10px 14px",
  background: "#ffffff",
  color: "#172033",
  border: "1px solid #d4d9e4",
  borderRadius: "8px",
  cursor: "pointer",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e5ed",
  borderRadius: "12px",
  padding: "22px",
};

const cellStyle = {
  padding: "13px 12px",
  borderBottom: "1px solid #e8ebf1",
};

export default AdminDashboard;