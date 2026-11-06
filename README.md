HustleHub+

HustleHub+ is a secure freelance marketplace where freelancers can advertise their services and clients can browse and book those services. The platform is built using the MERN stack, with a React frontend, an Express/Node.js API and MongoDB for data storage.

The project was developed across three parts. Part 1 established the secure backend foundation, Part 2 extended the application into a full-stack marketplace, and Part 3 added financial insights, DevSecOps practices, containerisation, logging and monitoring.

Project Features

Client and freelancer registration and login.

JWT-protected API operations and role-based access control.

Public service browsing and category filtering.

Freelancer service creation, updating and deletion, with ownership checks.

Client booking creation, booking history and booking cancellation.

Simulated transaction records linked to bookings, clients and freelancers.

Freelancer income summaries showing gross income, estimated tax and net income.

A freelancer dashboard for viewing financial information.

Admin-facing user management functionality.

API health and readiness endpoints.

Structured application and request logging.

Backend and frontend automated testing, static analysis and GitHub Actions CI.

Dockerfiles for the API and frontend, with Docker Compose orchestration.

Payment note: Transactions are simulated application records. HustleHub+ does not connect to a bank or payment gateway, process real payments, or transfer money.

Technology Stack

Area

Technology

Frontend

React 19, Vite, Axios

Backend

Node.js 22, Express 5

Database

MongoDB 8, Mongoose

Authentication

JSON Web Tokens (JWT), bcryptjs

Request validation

express-validator and Mongoose validation

API security

Helmet, Content Security Policy (CSP), express-rate-limit

Backend tests

Jest and Supertest

Frontend tests

Vitest, React Testing Library, jsdom

Static analysis

Oxlint

API test collection

Postman and Newman

Containerisation

Docker, Docker Compose and Nginx

Continuous integration

GitHub Actions

Logging

Structured JSON application and request logger

System Architecture

The React application sends requests to the Express API. The API is responsible for validating input, authenticating requests, enforcing roles and ownership, processing bookings and financial records, and accessing MongoDB through Mongoose.

The main application flow is:

Browser
   |
   v
React Frontend
   |
   | Axios API requests
   v
Nginx (Docker) / Vite Proxy (local development)
   |
   v
Express API
   |
   | Authentication, RBAC, ownership checks,
   | validation, rate limiting and business logic
   v
MongoDB through Mongoose

The backend is organised into routes, controllers, models, middleware and supporting utilities. Routes define the API endpoints, controllers handle request processing and business logic, models define the MongoDB structures, and middleware provides reusable authentication and request-processing functionality.

The frontend provides the user interface, but it is not treated as the security boundary. The API makes the final decision about whether a user is authorised to perform an operation.

User Roles

Clients can browse available services, create bookings, view their bookings and cancel their own bookings where permitted.

Freelancers can create and manage their own service listings, view bookings associated with their services and retrieve their income summary.

Administrators have separate user-management functionality for platform oversight.

Public registration is restricted to the supported client and freelancer roles. A user cannot grant themselves administrator privileges by submitting an admin role during public registration.

Part 1 — Secure Backend Foundations

Part 1 focused on establishing a secure backend foundation for HustleHub+. The backend handles account registration and login, password protection, JWT authentication, protected API routes, input validation, controlled errors and local HTTPS.

1. Authentication and Password Security

HustleHub+ supports user registration and login. During registration, the submitted information is validated, the password is hashed using bcryptjs, and the user account is saved to MongoDB. The application stores the password hash rather than the original plain-text password.

During login, the API retrieves the account using the submitted email address and uses bcryptjs to compare the submitted password with the stored hash. A JWT is generated after successful credential verification.

2. JWT Authentication

JSON Web Tokens identify authenticated users when they make protected requests. The client sends the token using the Bearer authentication format:

Authorization: Bearer <token>

The authentication middleware checks the Authorization header, extracts the token, verifies it using the server-side JWT_SECRET, rejects invalid or expired tokens, and makes the authenticated user's information available to the protected route.

The token includes the authenticated user's identity and role and is issued with a finite expiry. The signing secret is supplied through environment configuration rather than being hard-coded into the source code.

3. Protected Routes and Ownership

Authentication is required for protected operations. For example, creating, updating or deleting a service requires a valid JWT. The backend also checks the user's role and, where appropriate, confirms that the resource belongs to that user.

A valid token alone does not give a user permission to access every resource. Role checks and ownership checks are applied separately.

4. Input Validation and Error Handling

The API validates user input before processing it. Service information includes a title, description, category, price and location. The backend checks required fields and rejects invalid values, including negative prices. Mongoose model validation provides an additional layer of data consistency.

The API returns controlled JSON error responses with appropriate HTTP status codes. Unexpected errors are handled without exposing internal stack traces, file paths, database connection details or secret configuration values.

5. Local HTTPS

The standalone API supports HTTPS for local development using a locally generated self-signed certificate. The local API endpoint is:

https://localhost:3000

The certificate and private key are local development assets. They are excluded from version control and must not be committed to the repository.

To generate the local certificate from the api directory, create the ssl directory and run OpenSSL:

New-Item -ItemType Directory -Force ssl
openssl req -x509 -newkey rsa:2048 -nodes -keyout ssl/server.key -out ssl/server.crt -days 365 -subj "/CN=localhost"

The self-signed certificate is for local development only. It is not a replacement for a trusted TLS certificate in a public production deployment.

Part 2 — Full-Stack Application Development

Part 2 extended the backend into a full-stack freelance marketplace. The React frontend allows users to browse services and interact with the platform, while the Express API remains responsible for authentication, authorisation, validation, booking processing and database access.

6. React Frontend

The frontend is located in the client directory and is built with React and Vite. Axios is used to send API requests.

The interface supports:

Browsing available freelance services.

Filtering services by category.

Registering and logging in as a client or freelancer.

Logging out and clearing the stored session.

Opening the relevant dashboard for the signed-in user.

Allowing clients to initiate bookings.

Allowing freelancers to manage their own services and view booking and income information.

The frontend includes loading, empty and error states so that users receive feedback when information cannot be retrieved or an operation fails. Backend checks remain responsible for enforcing permissions.

7. Service Management

The service endpoints are:

GET    /api/hustles
GET    /api/hustles/:id
POST   /api/hustles
PUT    /api/hustles/:id
DELETE /api/hustles/:id

The GET endpoints allow users to browse the marketplace and retrieve an individual service. Authenticated freelancers can create, update and delete their own service listings. The API enforces the freelancer role and checks ownership before allowing changes to an existing service.

8. Booking and Transaction Functionality

Clients create bookings through:

POST /api/bookings

The API checks that the requester is authenticated and has the client role. It retrieves the selected service, checks that the booking is allowed, and associates the booking with the relevant client and freelancer. A client cannot book their own service, and the backend prevents an active duplicate booking for the same service where applicable.

A successful booking creates a corresponding simulated transaction record. The transaction is linked to the booking, service, client and freelancer. Transaction records are used by the application to calculate freelancer income; they do not represent actual payment processing.

Clients can retrieve their booking history and cancel their own bookings where permitted. Freelancers can retrieve bookings associated with their services.

9. Freelancer Income

Freelancers retrieve their income information through the protected income endpoint:

GET /api/bookings/freelancer/income

The endpoint uses the authenticated freelancer's identity to retrieve the relevant simulated transaction records. It does not accept a freelancer ID from the browser as proof of ownership.

The returned summary includes gross income, estimated tax and estimated net income. It also provides a recent monthly breakdown for the six most recent calendar months. Cancelled bookings are excluded from the income calculation.

10. Role-Based Access Control

Role-based access control (RBAC) determines which operations a logged-in user may perform.

Examples include:

Only freelancers can create, update or delete service listings.

Only clients can create bookings.

Clients can retrieve their own client bookings.

Freelancers can retrieve bookings associated with their services and their income summary.

Admin functionality is separated from normal client and freelancer operations.

Ownership checks are applied to protected modifications, such as service changes and booking cancellation. An authenticated user who does not have the required role is rejected, and a user cannot modify another user's resource simply because they have a valid JWT.

11. Rate Limiting and Security Headers

The authentication endpoints use express-rate-limit to reduce excessive repeated authentication requests. The configured limit is 10 requests per 15-minute window per client IP. When the limit is exceeded, the API returns a controlled 429 Too Many Requests response. The current implementation applies this limiter to authentication endpoints; it does not yet provide a separate booking-endpoint rate limiter. This is a remaining improvement against the Part 2 rubric's stronger rate-limiting criterion and should not be described as protection on booking routes.

Helmet configures HTTP security headers for the Express application. The application also defines a Content Security Policy (CSP), including restrictive directives such as default-src, base-uri, object-src, frame-ancestors and form-action. The policy must be reviewed when frontend resources or integrations change.

The API applies a JSON request-body size limit of 10 KB. This helps reduce the risk of excessively large request bodies consuming unnecessary application resources.

Part 3 — DevSecOps, Monitoring and Finalisation

Part 3 completes the project by adding financial insights, automated quality checks, containerisation, logging and monitoring. It also documents the additional controls used to protect the application and reviews how the implementation addresses common security threats.

12. Tax Estimation and Freelancer Financial Dashboard

The freelancer financial dashboard presents income-related information based on the simulated transactions recorded when bookings are created. It provides a structured summary of gross income, estimated tax and estimated net income, together with a recent monthly breakdown.

Tax estimation logic

The tax calculation uses a configurable flat estimate rather than a full personal income tax calculation. The rate is controlled by the TAX_ESTIMATE_RATE environment variable and defaults to 0.20 (20%) when no value is supplied.

The calculation is:

Gross income       = Sum of eligible simulated transaction amounts
Estimated tax      = Gross income × TAX_ESTIMATE_RATE
Estimated net      = Gross income − Estimated tax

For example, if eligible simulated transactions total R1,000 and the configured estimate rate is 20%:

Gross income       = R1,000.00
Estimated tax      = R1,000.00 × 0.20 = R200.00
Estimated net      = R1,000.00 − R200.00 = R800.00

The backend calculates the summary from eligible simulated transactions and returns the values in South African rand (ZAR). The monthly breakdown covers the six most recent calendar months. Cancelled bookings are excluded from the income calculation.

Important: This is an approximate application estimate for demonstration purposes. It is not financial or tax advice and is not a calculation of a person's official South African tax liability. Actual tax obligations depend on individual circumstances and applicable tax rules.

13. Continuous Integration with GitHub Actions

HustleHub+ uses GitHub Actions for continuous integration. The workflow is located at:

.github/workflows/ci.yml

The workflow runs automatically when code is pushed to master, when a pull request targets master, and it can also be started manually. It uses Node.js 22 for the application checks and contains three jobs. The integration job runs only after the backend and frontend jobs pass.

Backend workflow

The backend job:

Checks out the repository.

Sets up Node.js 22 and uses api/package-lock.json for dependency caching.

Installs dependencies with npm ci.

Runs npm audit --audit-level=high against the API dependency tree.

Runs the backend Jest test suite with npm test.

Runs Oxlint with npm run lint.

Runs the configured build/syntax check with npm run build.

Frontend workflow

The frontend job:

Checks out the repository.

Sets up Node.js 22 and uses client/package-lock.json for dependency caching.

Installs dependencies with npm ci.

Runs npm audit --audit-level=high against the frontend dependency tree.

Runs frontend tests with npm run test:run.

Runs Oxlint with npm run lint.

Builds the React application with npm run build.

Docker and API integration workflow

After both application jobs pass, the integration job:

Installs the root-level Newman test tooling using npm ci.

Runs the Newman-tooling dependency audit using npm audit --audit-level=critical.

Validates the Compose configuration with docker compose config --quiet.

Builds the API and frontend Docker images.

Starts MongoDB, the API and frontend using Docker Compose and waits for service health checks.

Checks the API readiness endpoint and frontend HTTP response.

Executes the committed Postman collection using Newman against the running Docker stack.

Prints container status, collects Docker logs if a step fails, and stops the services at the end of the job.

The workflow is configured to fail when a required test, lint, build, dependency-audit threshold, health check or Newman assertion fails. The integration job uses temporary CI-only credentials; these are not production secrets.

Dependency-audit scope and known findings

The API and frontend jobs use a high-severity threshold. The root-level Newman tooling audit currently uses a critical-severity threshold because its transitive development dependencies still have known high/moderate advisories that have not been safely resolved. Therefore, a passing root audit step does not mean that the entire development dependency tree is vulnerability-free. The known findings should be reviewed and updated when compatible upstream releases are available. The production-only API and frontend audits previously returned zero vulnerabilities, but the full dependency trees should be re-audited before submission.

The pipeline's dependency audits are package vulnerability checks. Oxlint is the configured static-analysis tool. These checks provide useful coverage, but they are not a substitute for a dedicated container image scanner or a comprehensive application security assessment.

The latest successful run should be checked in the GitHub repository's Actions tab before submission. The presence of a workflow file alone does not prove that the most recent remote run passed.

14. Static Code Analysis

Oxlint is used for static code analysis in both the backend and frontend projects. It is run locally and as part of the GitHub Actions workflow.

The commands are:

# From the api directory
npm run lint

# From the client directory
npm run lint

Oxlint checks the source code for configured linting and code-quality issues without executing the application. The results help identify issues such as suspicious patterns, unused variables and other code problems before changes are merged.

During the recorded local verification on 5 November 2026, the backend and frontend lint commands completed with zero reported warnings and zero reported errors. Re-run the commands after code changes and retain the actual output as submission evidence. A clean Oxlint result is evidence of a clean configured lint run; it should not be presented as proof that every possible security vulnerability has been eliminated.

15. Docker and Docker Compose

The backend and frontend are containerised separately, and Docker Compose orchestrates the application stack.

The main container files are:

api/Dockerfile
client/Dockerfile
docker-compose.yml
client/nginx.conf

The API Dockerfile uses Node.js 22 Alpine, installs production dependencies and starts the Express API. The frontend Dockerfile uses a build stage to create the Vite production bundle and an Nginx stage to serve the built files. Nginx also forwards /api requests to the API container.

Docker Compose runs three services:

mongo — MongoDB database service with a persistent named volume.

api — Express backend service connected to MongoDB through the private Compose network.

frontend — Nginx service that serves the React application and proxies API requests.

Health checks are configured for MongoDB, the API readiness endpoint and the frontend. The frontend waits for the API service to become healthy before starting.

Start the containerised application

From the project root, first create the root .env file using .env.example and provide the required environment values. Then run:

docker compose up --build -d

Check the status of the services:

docker compose ps

When the services are healthy, open the application at:

http://localhost:8080

The API is available through the frontend's /api proxy. The API container communicates with MongoDB over the private Docker network.

Useful Docker commands:

# Follow logs from all services
docker compose logs -f

# Follow API logs
docker compose logs -f api

# Check container health and status
docker compose ps

# Stop containers while preserving MongoDB data
docker compose down

MongoDB data is stored in the named Docker volume mongodb_data. Running docker compose down removes the containers but preserves the volume. Do not run docker compose down -v unless you intentionally want to delete the persisted database data.

Local development and Docker transport

The standalone API uses local HTTPS at https://localhost:3000 when the local certificate files are available and HTTPS is enabled. In the Docker Compose setup, Nginx serves the frontend on the host at http://localhost:8080, while the API communicates with Nginx and MongoDB over the private Compose network using HTTP internally.

The Compose configuration is a local demonstration and deployment setup. It is not, by itself, a public production deployment with an externally trusted TLS certificate, managed production secrets or production-grade infrastructure.

16. Logging and Monitoring

HustleHub+ uses a structured JSON logger and request-logging middleware. The logger records consistent event information so application activity can be reviewed during development, testing and troubleshooting.

The structured log entries can include:

Timestamp and severity level.

Service and event name.

Request ID, where available.

HTTP method and request path.

Response status code and request duration.

Relevant event context for authentication, bookings, transactions and errors.

Key events include successful and unsuccessful login attempts, booking creation and cancellation, simulated transaction creation, database connection events, server startup and application errors. Passwords, JWTs, private keys and other secrets must not be written to logs.

The logger writes to the application process output. In Docker, these logs can be viewed using:

docker compose logs -f api

Structured logs make it easier to identify repeated failed logins, investigate booking or transaction issues, trace individual requests and understand application errors.

The current implementation provides application-level structured logging and access through Docker logs. It does not currently forward logs to a separately configured cloud-based logging platform. A cloud logging destination would be an additional deployment improvement and should only be claimed once it has been configured and demonstrated.

Health and readiness monitoring

The API exposes health endpoints:

Method

Endpoint

Purpose

GET

/api/health

Basic API health response.

GET

/api/health/live

Liveness check that confirms the API process is responding.

GET

/api/health/ready

Readiness check that confirms the API can access MongoDB.

The readiness endpoint returns a successful response when the database connection is ready and a service-unavailable response when the database is disconnected. Docker uses the readiness endpoint for the API health check. This allows the container runtime to distinguish an API process that is running from an API that is ready to serve database-backed requests.

17. Additional Security Features

In addition to the core Part 1 and Part 2 security controls, the application includes the following measures:

Request body size limit: JSON request bodies are limited to 10 KB. This reduces exposure to oversized payloads and unnecessary resource consumption.

Public role allow-list: public registration only accepts the supported client and freelancer roles. A user cannot register themselves as an administrator by changing the submitted role value.

Transaction integrity controls: transaction records are associated with a booking and use a unique booking reference to prevent duplicate transaction records for the same booking. Booking creation also handles a transaction-creation failure by rolling back the booking record, avoiding a partially completed booking/transaction operation.

These controls supplement JWT authentication, role-based access control, ownership checks, validation, rate limiting and Helmet/CSP. They do not remove the need for secure deployment configuration, monitoring and ongoing testing.

18. Final Security Review

The following table maps common application threats to the controls used in HustleHub+.

Threat

Relevant controls in HustleHub+

How the controls help

Injection and malformed input

Request validation, express-validator checks, Mongoose schema validation and controlled model operations

Invalid or incomplete values are rejected before they are stored or used by the application. Model validation also helps maintain consistent data types and required fields.

Cross-site scripting (XSS)

React's standard text rendering, Helmet security headers and the configured Content Security Policy

React escapes ordinary text output by default, while the CSP restricts the sources from which the browser may load or execute resources. User-provided content should continue to be rendered as text and should not be inserted as trusted HTML.

Weak or stolen authentication credentials

bcryptjs password hashing, JWT verification, a server-side JWT secret, token expiry and authentication rate limiting

Passwords are not intentionally stored in plain text, protected routes require a verified token, and rate limiting makes repeated authentication attempts more difficult.

Privilege escalation

Public registration role allow-list and backend role middleware

A public registration request cannot assign the admin role, and role-specific actions are checked by the API.

Insecure direct object references / unauthorised resource changes

Ownership checks on service changes and booking cancellation; income retrieval is scoped to the authenticated freelancer

Users cannot use a valid login alone to modify another user's resource or retrieve another freelancer's private income summary.

Excessive request payloads

10 KB JSON body-size limit

Oversized request bodies are rejected before the API processes them.

Excessive authentication requests

express-rate-limit on authentication endpoints

Repeated requests are limited and an exceeded limit receives a controlled 429 Too Many Requests response.

Information leakage through errors or logs

Controlled API error responses and structured logs that exclude passwords and tokens

Internal stack traces, file paths, configuration secrets and authentication tokens should not be exposed to users or written to logs.

Duplicate or incomplete transaction records

Unique transaction reference per booking and rollback handling when transaction creation fails

The application reduces the risk of duplicate transaction records and avoids leaving a booking record behind when its transaction cannot be created.

Security is applied at multiple layers. The frontend provides a clear user experience, but the backend validates every request and enforces authentication, role and ownership rules. Security headers, rate limiting, request-size limits, safe error handling and logging provide additional layers of protection.

No single control protects against every possible attack. The application still requires secure secret management, an appropriately configured production environment, regular dependency updates, review of CSP directives and continued security testing.

19. Automated Testing

Testing is used to check the API, frontend behaviour and security-related responses.

Backend automated tests

The backend uses Jest and Supertest. From the repository root:

cd api
npm ci
npm test
npm run lint
npm run build

The backend test suite covers the API's implemented behaviour. Oxlint checks source code, and the build command performs the configured Node.js syntax/build check.

Frontend automated tests

The frontend uses Vitest, React Testing Library and jsdom. From the repository root:

cd client
npm ci
npm run test:run
npm run lint
npm run build

The frontend tests cover:

Rendering the marketplace and loading services.

Filtering services by category.

Displaying an error when marketplace loading fails.

Opening the login form and switching to registration.

Submitting login details and storing the authenticated session.

Displaying an authentication error when login fails.

Prompting visitors to log in before attempting to book.

Logging out and clearing the stored session.

API testing with Postman and Newman

Postman is used to organise the API requests, while Newman runs the collection from the command line. The collection is located at:

postman/collections/HustleHub+ - Part 2 API Tests/HustleHub-Part2.postman_collection.json

The collection covers health endpoints, security headers, public marketplace access, client and freelancer registration and login, invalid authentication, role-based restrictions, service creation, booking operations, income retrieval, invalid input, invalid identifiers and authentication rate limiting.

For the Docker-based local endpoint, run Newman from the repository root. Restart the API first so that the in-memory rate-limit counter is reset:

docker compose restart api
npx --yes newman@6.2.3 run "postman/collections/HustleHub+ - Part 2 API Tests/HustleHub-Part2.postman_collection.json" --env-var "baseUrl=http://localhost:8080" --reporters cli

To generate a JSON report as well:

npx --yes newman@6.2.3 run "postman/collections/HustleHub+ - Part 2 API Tests/HustleHub-Part2.postman_collection.json" --env-var "baseUrl=http://localhost:8080" --reporters cli,json --reporter-json-export reports/newman-report.json

The collection's request order is significant to the rate-limit scenario. Run the collection as supplied and do not move the rate-limit requests ahead of the authentication requests. The Docker endpoint uses HTTP through Nginx, so --insecure is not needed. When testing the standalone HTTPS API with its local self-signed certificate, Newman may require --insecure; use that option only for local development.

A recorded local Newman run on 5 November 2026 completed 28 requests and 42 assertions with zero failures. This is evidence for that particular execution, not a guarantee about later runs. Regenerate the report after relevant code changes. Review generated reports before committing or sharing them because request and response data can contain test account details or bearer tokens.

Recorded local verification

The following results were recorded during local verification on 5 November 2026:

Area

Recorded result

Backend automated tests

8 tests passed, 0 failed

Backend Oxlint

0 reported warnings, 0 reported errors

Backend build/syntax check

Passed

Frontend automated tests

9 tests passed, 0 failed

Frontend Oxlint

0 reported warnings, 0 reported errors

Frontend production build

Passed

Newman API collection

28 requests, 42 assertions, 0 failures

Docker Compose

Configuration validated; MongoDB, API and frontend containers reported healthy

These are recorded results from the stated local verification date. Re-run the relevant commands after changes and retain evidence from the final committed version.

Recorded CI integration result

A successful GitHub Actions run after the MongoDB Linux-kernel compatibility adjustment completed all three workflow jobs:

CI job

Recorded result

Backend tests, dependency audit, Oxlint and build

Passed

Frontend tests, dependency audit, Oxlint and build

Passed; 9 frontend tests passed

Docker build and Newman API integration

Passed

The corresponding local Newman run completed 28 requests and 42 assertions with zero failures. These results describe the specific runs observed during development. Before final submission, check the latest workflow run after all final commits and update this evidence if the results change.

20. Environment Configuration

Sensitive configuration values are supplied through environment variables. The root .env file is used by the Docker Compose setup and must be created from .env.example.

The configuration includes:

Variable

Purpose

MONGO_ROOT_USERNAME

MongoDB root username used by the Compose database service.

MONGO_ROOT_PASSWORD

MongoDB root password used by the Compose database service.

JWT_SECRET

Secret used to sign and verify JWTs. Use a strong private value.

TAX_ESTIMATE_RATE

Optional estimated tax rate used by the freelancer income calculation. Defaults to 0.20 when not supplied.

HTTPS_ENABLED

Controls HTTPS mode for the standalone API; Docker runs the API internally over HTTP.

PORT

API listening port where configured.

The exact required values should be taken from .env.example. Never commit the real .env file, expose secret values in screenshots, or paste secrets into the README. Local SSL certificate and private-key files must also remain outside version control.

21. Running HustleHub+

Recommended: Docker Compose

Install Docker Desktop and make sure Docker Compose is available.

Create the root .env file using .env.example and provide the required values.

Open a terminal in the repository root.

Start the services:

docker compose up --build -d

Check that the containers are healthy:

docker compose ps

Open the application:

http://localhost:8080

Run the API and frontend separately

MongoDB must be running and the API environment variables must be configured first.

Start the API in one terminal:

cd api
npm ci
npm run dev

The local HTTPS API is expected at:

https://localhost:3000

Start the frontend in another terminal:

cd client
npm ci
npm run dev

Vite starts the React development server and uses the configured /api proxy to forward requests to the standalone local API.

22. Repository Structure

The main project structure is:

.
├── api/                              # Express API, models, controllers and tests
│   ├── src/
│   └── Dockerfile
├── client/                           # React/Vite frontend and frontend tests
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── postman/                          # Postman API test collection
├── reports/                          # Generated Newman report and test evidence
├── .github/workflows/ci.yml          # GitHub Actions workflow
├── docker-compose.yml                # MongoDB, API and frontend orchestration
├── .env.example                      # Environment-variable template
└── README.md

23. Demonstration and Submission Evidence

The final demonstration should show the complete application flow and the main Part 3 additions.

The demonstration should include:

Starting the application using Docker Compose and showing the services running.

Opening the marketplace and browsing or filtering services.

Registering or logging in as a freelancer and creating or managing a service.

Registering or logging in as a client and creating a booking.

Showing the booking and its simulated transaction record.

Showing the freelancer's booking and financial dashboard, including gross income, estimated tax and net income.

Demonstrating relevant rejected requests, such as unauthorised role access, invalid input or an exceeded rate limit.

Showing the API health/readiness response and structured application logs.

Showing backend and frontend test results, Oxlint output, Newman results and the GitHub Actions workflow result.

Submission evidence should include the final GitHub repository, this README, the Postman collection, Newman report, frontend and backend test output, static analysis results, Dockerfiles, Docker Compose configuration, logging evidence, screenshots and the demonstration video.

Add the actual demonstration-video link once the video has been uploaded. Do not add a placeholder URL. Screenshots and reports should match the final committed version of the application.

Final Project Summary

HustleHub+ has progressed from a secure backend foundation into a full-stack freelance marketplace with service management, client bookings, simulated transactions and freelancer income reporting. Part 3 adds configurable tax estimation, a financial dashboard, GitHub Actions automation, static analysis, Docker-based orchestration, structured logging and health/readiness monitoring.

The project applies security controls across authentication, authorisation, resource ownership, request validation, rate limiting, security headers, request-size restrictions, error handling and transaction integrity. The backend remains responsible for enforcing access rules, while the frontend presents the functionality to users.

