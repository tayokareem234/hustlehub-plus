import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    render,
    screen,
    waitFor,
    within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import api from "../api";

vi.mock("../api", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

vi.mock("../Dashboard", () => ({
    default: ({ user }) => (
        <div>
            <h1>Dashboard</h1>
            <p>{user.name}</p>
            <button onClick={() => {}}>
                Dashboard loaded
            </button>
        </div>
    ),
}));

const mockServices = [
    {
        _id: "service-1",
        title: "Website Development",
        category: "Development",
        description: "Professional website development services.",
        price: 1500,
        location: "Pretoria",
        createdBy: {
            _id: "freelancer-1",
            name: "Alex Freelancer",
            email: "alex@example.com",
        },
    },
    {
        _id: "service-2",
        title: "Logo Design",
        category: "Design",
        description: "Creative logo design for businesses.",
        price: 500,
        location: "Johannesburg",
        createdBy: {
            _id: "freelancer-2",
            name: "Sam Designer",
            email: "sam@example.com",
        },
    },
];

describe("HustleHub+ frontend", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        api.get.mockImplementation((url) => {
            if (url === "/hustles") {
                return Promise.resolve({
                    data: {
                        success: true,
                        hustles: mockServices,
                    },
                });
            }

            if (url === "/auth/me") {
                return Promise.resolve({
                    data: {
                        success: true,
                        user: {
                            id: "test-user",
                            name: "Test User",
                            email: "test@example.com",
                            role: "client",
                        },
                    },
                });
            }

            return Promise.reject(
                new Error(`Unexpected GET request: ${url}`)
            );
        });
    });

    it("renders the marketplace and loads services from the API", async () => {
        render(<App />);

        expect(
            screen.getByRole("heading", {
                name: /turn your skills/i,
            })
        ).toBeInTheDocument();

        expect(
            await screen.findByRole("heading", {
                name: "Website Development",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: "Logo Design",
            })
        ).toBeInTheDocument();

        expect(api.get).toHaveBeenCalledWith("/hustles");

        expect(
            screen.getByText("Alex Freelancer")
        ).toBeInTheDocument();
    });

    it("filters marketplace services by category", async () => {
        const user = userEvent.setup();

        render(<App />);

        await screen.findByRole("heading", {
            name: "Website Development",
        });

        await user.click(
            screen.getByRole("button", {
                name: "Design",
            })
        );

        expect(
            screen.getByRole("heading", {
                name: "Logo Design",
            })
        ).toBeInTheDocument();

        expect(
            screen.queryByRole("heading", {
                name: "Website Development",
            })
        ).not.toBeInTheDocument();

        await user.click(
            screen.getByRole("button", {
                name: "All",
            })
        );

        expect(
            screen.getByRole("heading", {
                name: "Website Development",
            })
        ).toBeInTheDocument();
    });

    it("displays an error message when marketplace loading fails", async () => {
        api.get.mockImplementation((url) => {
            if (url === "/hustles") {
                return Promise.reject(
                    new Error("Network unavailable")
                );
            }

            return Promise.reject(
                new Error(`Unexpected GET request: ${url}`)
            );
        });

        render(<App />);

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent(
            "We couldn't load the marketplace services. Please try again."
        );
    });

    it("opens the login form when a visitor clicks Log in", async () => {
        const user = userEvent.setup();

        render(<App />);

        await user.click(
            screen.getByRole("button", {
                name: "Log in",
            })
        );

        expect(
            screen.getByRole("dialog")
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: "Welcome back.",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText("Email address")
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText("Password")
        ).toBeInTheDocument();
    });

    it("switches from login to registration", async () => {
        const user = userEvent.setup();

        render(<App />);

        await user.click(
            screen.getByRole("button", {
                name: "Log in",
            })
        );

        const dialog = screen.getByRole("dialog");

        await user.click(
            within(dialog).getByRole("button", {
                name: "Sign up",
            })
        );

        expect(
            screen.getByRole("heading", {
                name: "Create your account.",
            })
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText("Full name")
        ).toBeInTheDocument();

        expect(
            screen.getByLabelText("I want to join as a")
        ).toBeInTheDocument();

        expect(
            within(dialog).getByRole("button", {
                name: "Create account",
            })
        ).toBeInTheDocument();
    });

    it("submits login details and stores the authenticated session", async () => {
        const user = userEvent.setup();

        api.post.mockResolvedValue({
            data: {
                success: true,
                token: "test-jwt-token",
                user: {
                    id: "client-123",
                    name: "Test Client",
                    email: "client@example.com",
                    role: "client",
                },
            },
        });

        render(<App />);

        await user.click(
            screen.getByRole("button", {
                name: "Log in",
            })
        );

        const dialog = screen.getByRole("dialog");

        await user.type(
            within(dialog).getByLabelText("Email address"),
            "CLIENT@example.com"
        );

        await user.type(
            within(dialog).getByLabelText("Password"),
            "TestPassword123!"
        );

        await user.click(
            within(dialog).getByRole("button", {
                name: "Log in",
            })
        );

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith(
                "/auth/login",
                {
                    email: "client@example.com",
                    password: "TestPassword123!",
                }
            );
        });

        await waitFor(() => {
            expect(
                localStorage.getItem("hustlehub_token")
            ).toBe("test-jwt-token");
        });

        expect(
            JSON.parse(
                localStorage.getItem("hustlehub_user")
            )
        ).toEqual({
            id: "client-123",
            name: "Test Client",
            email: "client@example.com",
            role: "client",
        });

        expect(
            screen.getByText("Hi, Test Client")
        ).toBeInTheDocument();
    });

    it("shows an authentication error when login fails", async () => {
        const user = userEvent.setup();

        api.post.mockRejectedValue({
            response: {
                data: {
                    message: "Invalid email or password.",
                },
            },
        });

        render(<App />);

        await user.click(
            screen.getByRole("button", {
                name: "Log in",
            })
        );

        const dialog = screen.getByRole("dialog");

        await user.type(
            within(dialog).getByLabelText("Email address"),
            "wrong@example.com"
        );

        await user.type(
            within(dialog).getByLabelText("Password"),
            "WrongPassword123!"
        );

        await user.click(
            within(dialog).getByRole("button", {
                name: "Log in",
            })
        );

        expect(
            await screen.findByRole("alert")
        ).toHaveTextContent("Invalid email or password.");
    });

    it("opens login when a visitor attempts to book a service", async () => {
        const user = userEvent.setup();

        render(<App />);

        await screen.findByRole("heading", {
            name: "Website Development",
        });

        await user.click(
            screen.getByRole("button", {
                name: "Book Website Development",
            })
        );

        expect(
            screen.getByRole("dialog")
        ).toBeInTheDocument();

        expect(
            screen.getByRole("heading", {
                name: "Welcome back.",
            })
        ).toBeInTheDocument();

        expect(api.post).not.toHaveBeenCalled();
    });

    it("allows a user to log out and clears the stored session", async () => {
        const user = userEvent.setup();

        localStorage.setItem(
            "hustlehub_token",
            "existing-test-token"
        );

        localStorage.setItem(
            "hustlehub_user",
            JSON.stringify({
                id: "client-123",
                name: "Test Client",
                email: "client@example.com",
                role: "client",
            })
        );

        render(<App />);

        // The mocked /auth/me response supplies the authenticated name.
        await screen.findByText("Hi, Test User");

        await user.click(
            screen.getByRole("button", {
                name: "Log out",
            })
        );

        expect(
            localStorage.getItem("hustlehub_token")
        ).toBeNull();

        expect(
            localStorage.getItem("hustlehub_user")
        ).toBeNull();

        expect(
            screen.getByRole("button", {
                name: "Log in",
            })
        ).toBeInTheDocument();
    });
});