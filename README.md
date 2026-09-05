HustleHub+
Part 1 — Secure Backend Foundations

HustleHub+ is a secure freelance marketplace platform that allows freelancers to advertise their services while allowing clients to browse and interact with the services available on the platform.

Part 1 focuses on building the secure backend foundation of the application. The backend will handle important features such as user registration and login, protected API routes, hustle management, password hashing, JWT authentication, input validation, controlled error handling, and local HTTPS.

# 1. System Overview

HustleHub+ is being developed using the MERN stack. The technologies being used are:

MongoDB — Used to store the application's data.
Express.js — Used to build the backend and API.
React.js — Used for the frontend, which will be developed at a later stage.
Node.js — Used to run the backend server.

The main users of HustleHub+ will be:

Clients — Users who will be able to browse and book freelance services.
Freelancers — Users who will be able to advertise and manage their own services.
Administrators — Users who will be responsible for managing and overseeing the platform.

For Part 1, the main focus is on creating a secure backend that can support these different types of users.

# 2. Part 1 Architecture

![HustleHub+ Part 1 Architecture](IMAGES/ARCHITECTURE.png)

Security Boundary:
Client → HTTPS → Express API → Authentication/Validation → Database

The React frontend communicates with the Express backend through HTTPS requests using a JSON API. The backend is responsible for handling requests, checking authentication and validating user input before accessing the database.

Mongoose is used to connect the Express backend to MongoDB. The database will store information such as users and hustles.

The main security boundary is between the client and the backend. Requests are sent over HTTPS, and the backend checks authentication and validates the information before allowing access to protected resources.

HustleHub+ allows users to create an account and log in securely. The authentication system is responsible for checking user information, protecting passwords, and giving authenticated users access to protected parts of the application.

# 3. Backend Structure
The backend is located in the api directory.

The backend follows a modular structure:

. Routes define API endpoints.
. Controllers contain request-processing and business logic.
. Models define MongoDB data structures using Mongoose.
. Middleware provides reusable request-processing and authentication functionality.
. Utils contains supporting functionality such as database connection logic.
. server.js configures Express, HTTPS, routes, and application startup.


# 4. Authentication
HustleHub+ supports user registration and login.

## Registration

When a user creates an account, the following steps take place:

1. The user enters their registration information.
2. The information is checked to make sure it is valid.
3. The user's password is hashed using bcrypt.
4. Only the hashed version of the password is stored in MongoDB.
5. The user account is then created.

The user's actual plain-text password is never intentionally stored in the database.

## Login

When a user logs into HustleHub+, the following steps take place:

1. The user enters their email and password.
2. The system uses the email to find the user's account.
3. bcrypt compares the password entered by the user with the stored password hash.
4. If the details are correct, a JWT is generated.
5. The JWT is then used to identify the authenticated user when they make protected requests.


# 5. Password Security

HustleHub+ uses **bcrypt** to protect user passwords.

The application does not store users' actual plain-text passwords in the database. Instead, each password is converted into a secure hash before it is stored.

When a user logs in, bcrypt checks the password they entered against the stored password hash to see if they match.

This helps protect users' passwords and reduces the risk of their original passwords being exposed if someone gains unauthorised access to the database.


# 6. JWT Authentication
JSON Web Tokens (JWTs) are used to identify authenticated users after login.

The authentication flow is:

User Login
    │
    ▼
Email + Password
    │
    ▼
Find User
    │
    ▼
bcrypt Password Verification
    │
    ▼
Valid Credentials
    │
    ▼
JWT Generated
    │
    ▼
Client Sends:
Authorization: Bearer <token>
    │
    ▼
Authentication Middleware
    │
    ▼
JWT Verified
    │
    ▼
Protected API Route

Protected API requests in HustleHub+ require a valid Bearer token. This is used to make sure that only authenticated users can access protected parts of the application.

The authentication middleware handles the following:

Checks that an Authorization header is included in the request.
Makes sure the request uses the Bearer authentication scheme.
Extracts the JWT from the request.
Verifies the JWT using the server-side JWT secret.
Rejects tokens that are invalid or have expired.
Makes the authenticated user's information available to the protected controllers.

The JWT secret is stored in the environment configuration instead of being written directly into the source code. This helps keep the secret protected and prevents it from being exposed in the application code.

# 7. Protected API Routes

Authentication is required for operations that modify HustleHub+ data.

Examples include:

POST   /api/hustles
PUT    /api/hustles/:id
DELETE /api/hustles/:id

A request without valid authentication receives a controlled 401 Unauthorized response.

For hustle modification operations, ownership is also checked. A user cannot update or delete a hustle belonging to another user.


# 8. Input Validation

HustleHub+ checks the information provided by users before it is processed. This helps make sure that the data being sent to the backend is valid and that important information is not missing.

When creating a hustle, the user needs to provide:

* **Title**
* **Description**
* **Category**
* **Price**
* **Location**

The application rejects requests when any of the required information is missing.

The Hustle model also has database-level validation to help keep the data consistent. This includes:

* Required fields
* Trimming unnecessary spaces from strings
* Making sure prices are not negative
* Checking that user references are valid

If the information provided is invalid, the application returns a controlled **`400 Bad Request`** response instead of accepting the invalid data.



# 9. Secure Error Handling
HustleHub+ uses controlled error responses when something goes wrong with an API request.

The API does not expose sensitive internal information to users, such as:

* Stack traces
* File paths
* Configuration values
* Database connection details

For expected errors, the API returns the correct HTTP status code along with a clear JSON response.

For example:

```json
{
    "success": false,
    "message": "Authentication required"
}
```

If an unexpected error occurs on the server, the API returns a general error message instead of showing internal implementation details. This helps prevent sensitive information about the backend from being exposed to users.


# 10. HTTPS

HustleHub+ uses **HTTPS** for the API during local development. This allows communication between the client and backend to be encrypted.

A locally generated self-signed SSL certificate is used:

```text
api/ssl/server.crt
api/ssl/server.key
```

The Node.js HTTPS server loads these certificate files and uses them to run the Express application through:

```text
https://localhost:3000
```

Using HTTPS helps protect the information being sent between the client and backend by encrypting the communication.

The SSL certificate and private key are also excluded from Git using `.gitignore`. The private key should never be committed to the public repository.

### Local HTTPS Test

The HTTPS API was tested using:

```text
https://localhost:3000/api/health
```

The endpoint returned:

```text
HTTP/1.1 200 OK
```

with the following response:

```json
{
    "success": true,
    "message": "HustleHub+ API is running"
}
```

Because the certificate is self-signed, development tools may require certificate verification to be bypassed when testing the API locally.


# 11. Environment Variables

HustleHub+ stores sensitive configuration values in a `.env` file. This keeps important information such as database details and security secrets out of the main source code.

Some of the environment variables used include:

```text
PORT
MONGO_URI
JWT_SECRET
```

The `.env` file is excluded from version control using `.gitignore` so that sensitive information is not uploaded to the repository.

An `.env.example` file is also provided. This shows which configuration values are required without including the actual secret values.

---

# 12. API Endpoints

## Health

```text
GET /api/health
```

This endpoint is used to check whether the HustleHub+ API is running correctly.

---

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

These endpoints are used to register new users and allow existing users to log in.

---

## Users

```text
GET /api/users
```

This endpoint provides the current user-related API functionality.

---

## Hustles

```text
GET    /api/hustles
GET    /api/hustles/:id
POST   /api/hustles
PUT    /api/hustles/:id
DELETE /api/hustles/:id
```

These endpoints handle the main hustle management functionality in Part 1.

Users can retrieve hustles, view individual hustles, create new hustles, update existing hustles, and delete hustles.

Creating, updating, and deleting hustles require the user to be authenticated.

---

# 13. Running the Backend

To run the HustleHub+ backend, first navigate to the API directory:

```bash
cd api
```

Install the required dependencies:

```bash
npm install
```

Start the API using:

```bash
node src/server.js
```

The API should then be available at:

```text
https://localhost:3000
```

If everything starts correctly, the console should display:

```text
HustleHub+ API running on https://localhost:3000
MongoDB connected successfully
```

---

# 14. Testing

The HustleHub+ API is tested using **Postman** to make sure that the different endpoints and security features are working correctly.

## Registration Testing

A successful registration request should create a new user account and return a successful response.

The registration endpoint is:

```text
POST /api/auth/register
```

The request needs to contain the required user information, including the user's name, email, password and role.

A successful registration shows that the API can receive the user's information, validate it, securely hash the password and create the account.

---

## Login Testing

The login endpoint is:

```text
POST /api/auth/login
```

A successful login checks the user's credentials and generates a JWT.

The JWT can then be used to authenticate the user when making requests to protected API routes.

---

## Invalid Input Testing

Invalid requests are also tested to make sure that the API does not accept incorrect or incomplete information.

Examples of invalid requests include:

* Missing required registration fields
* Invalid login credentials
* Missing required hustle fields
* Negative hustle prices
* Invalid authentication information

When invalid information is submitted, the API should return an appropriate HTTP status code and a controlled JSON response.

---

## Protected Route Testing

Protected routes are tested to make sure that authentication is being enforced correctly.

Examples of protected routes include:

```text
POST /api/hustles
PUT /api/hustles/:id
DELETE /api/hustles/:id
```

If a request is made without a valid JWT, the request should be rejected with:

```text
401 Unauthorized
```

A valid JWT must be included using the Bearer authentication format:

```text
Authorization: Bearer <token>
```

The authentication middleware checks and verifies the token before allowing the request to continue.

---

# 15. Postman Testing

**Postman** is used to test the HustleHub+ API and make sure that the different endpoints and security features are working correctly.

The Part 1 Postman collection will include both successful and unsuccessful API requests.

The collection will include tests for:

1. Successful user registration
2. Successful user login
3. JWT token generation
4. Accessing a protected route using a valid JWT
5. Accessing a protected route without authentication
6. Invalid login credentials
7. Missing required input
8. Invalid hustle information
9. Creating a hustle
10. Retrieving hustles
11. Updating a hustle
12. Deleting a hustle
13. Ownership protection when modifying hustles

These tests provide evidence that the main API functionality and security controls are working as expected.

---

# 16. Evidence

Screenshots will be used to show the results of the Part 1 testing.

The evidence will include:

* API running over HTTPS
* Successful user registration
* Successful user login
* JWT token generation
* Protected API request using a valid token
* Request rejected without authentication
* Invalid login response
* Invalid input response
* Successful hustle creation
* Successful hustle update
* Successful hustle deletion
* Ownership protection response

The screenshots will be taken during the API testing process and included as evidence for the Part 1 submission.

---

# 17. Demonstration Video

A demonstration video will be recorded as part of the Part 1 submission.

The video will demonstrate:

1. Starting the HustleHub+ backend.
2. Showing the API running over HTTPS.
3. Registering a new user.
4. Logging in using the registered account.
5. Showing the JWT generated after a successful login.
6. Using the JWT to make a protected API request.

The demonstration will show that the secure backend functionality is working in practice.

---

# 18. Part 1 Security Summary

The main security features included in the Part 1 backend are:

| Security Requirement  | Implementation                          |
| --------------------- | --------------------------------------- |
| Password security     | bcrypt password hashing                 |
| User authentication   | JWT                                     |
| Protected API routes  | JWT authentication middleware           |
| Authentication format | Bearer token                            |
| Input validation      | Controller and Mongoose validation      |
| Error handling        | Controlled JSON responses               |
| HTTPS                 | Local self-signed SSL certificate       |
| Secret management     | Environment variables                   |
| Database access       | MongoDB with Mongoose                   |
| Ownership protection  | Authenticated user ID comparison        |
| Git security          | `.env`, `.key` and `.crt` files ignored |

These security controls provide the main secure backend foundation required for Part 1 of HustleHub+.

