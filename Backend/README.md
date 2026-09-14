# 🍽️ Restaurant API & Authentication Module
## ✨ Features
*   **Authentication & Security**: Secure user registration and login using `bcryptjs` for password hashing and `jsonwebtoken` (JWT) for session management.
*   **Role-Based Access Control**: Route protection middleware to differentiate access between regular customers and admins.
*   **CRUD Operations**: Complete Create, Read, Update, and Delete capabilities for restaurants.
*   **Database Modeling**: Mongoose schema with built-in validation for fields like name, cuisine, price level, and rating.
*   **File Uploads (Multer)**: Implemented image uploading. Users/Admins can upload a restaurant or profile image which is saved locally.

## 👥 User Roles
*   **Customer**: Default role. Can browse restaurants and view their own profile.
*   **Admin**: Authorized to manage the system (e.g., Create, Update, or Delete restaurants).

## 🔗 API Endpoints

### 🔐 Auth & User Routes
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| POST | `/api/v1/auth/signup` | Public | Register a new user & return JWT |
| POST | `/api/v1/auth/login` | Public | Authenticate user & return JWT |
| GET | `/api/v1/users/profile` | Protected | Fetch logged-in user's profile |

### 🍔 Restaurant Routes
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| GET | `/api/v1/restaurants` | Public | Fetches a list of all restaurants |
| GET | `/api/v1/restaurants/:id` | Public | Fetches a single restaurant by its ID |
| POST | `/api/v1/restaurants` |public| Creates a new restaurant (requires `image` file) |
| PATCH | `/api/v1/restaurants/:id`| Admin Only | Updates restaurant details or image |
| DELETE| `/api/v1/restaurants/:id`| Admin Only | Removes a restaurant from the database |

> **Note on Data Validation**: 
> * **Cuisines accepted**: `italian`, `mexican`, `egyptian`, `lebanese`, `syrian`, `chinese`, `indian`, `american`, `japanese`, `fast_food`, `other`.
> * **Price Levels accepted**: `budget`, `moderate`, `expensive`.

## 🚀 How to Run the Project Local
1. Clone the repository to your local machine.
2. Run `npm install` to install all dependencies.
3. Create a `.env` file and add the following variables:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d