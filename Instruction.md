# Project Setup and Documentation

This document provides instructions for setting up the web and mobile applications, test credentials, APK download information, and API documentation.

## Table of Contents

1.  [Prerequisites](#prerequisites)
2.  [Backend Setup](#backend-setup)
3.  [Web Application (Frontend) Setup](#web-application-frontend-setup)
4.  [Mobile Application Setup](#mobile-application-setup)
5.  [APK Information](#apk-information)
6.  [Test Credentials](#test-credentials)
7.  [API Documentation](#api-documentation)
    - [Web API (`api.ts`)](#web-api-apits)
    - [Mobile App API (`api_service.dart`)](#mobile-app-api-api_servicedart)

## 1. Prerequisites

- **Node.js and npm/yarn:** For running the backend and frontend.
- **Flutter SDK:** For running the mobile application.
- **Android Studio/VS Code with Flutter extension:** For mobile development.
- **A running instance of the backend server.**

## 2. Backend Setup

The backend server is crucial for both the web and mobile applications.

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies (assuming `package.json` exists):
    ```bash
    npm install
    # or yarn install
    ```
3.  Start the server (assuming a start script like `npm start` or `node server.js`):
    ```bash
    npm start
    # or node server.js
    ```
    The backend is expected to run on `http://localhost:5000`.

## 3. Web Application (Frontend) Setup

The frontend is a Next.js application.

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or yarn install
    ```
3.  Create a `.env.local` file in the `frontend` directory and set the API URL if it's different from the default:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:5000/api
    ```
4.  Start the development server:
    ```bash
    npm run dev
    # or yarn dev
    ```
    The web application will typically be available at `http://localhost:3000`.

## 4. Mobile Application Setup

The mobile application is built with Flutter.

1.  Ensure you have the Flutter SDK installed and configured.
2.  Navigate to the `application` directory:
    ```bash
    cd application
    ```
3.  Get Flutter dependencies:
    ```bash
    flutter pub get
    ```
4.  **Important:** Update the API base URL in `application/lib/services/api_service.dart` if your backend is not running on `http://192.168.0.12:5000`.
    ```dart
    // In application/lib/services/api_service.dart
    // static const String _baseUrl = 'http://YOUR_BACKEND_IP:5000/api';
    static const String _baseUrl = 'http://192.168.0.12:5000/api'; // Default
    ```
    Replace `192.168.0.12` with your computer's local network IP address if running the backend locally and testing on a physical device. If using an emulator, `10.0.2.2` (for Android Emulator) or `localhost` (for iOS Simulator if backend is on the same machine) might work for the IP, followed by the port `:5000`.
5.  Run the application on a connected device or emulator:
    ```bash
    flutter run
    ```

## 5. APK Information

The mobile application is available for users.

- **Building the APK:**
  You can build the APK yourself by navigating to the `application` directory and running:

  ```bash
  flutter build apk --release
  ```

  The output APK can typically be found at: `application/build/app/outputs/flutter-apk/app-release.apk`.

- **Pre-built APK Download Path:**
  _(If a pre-built APK is hosted, please specify the download link here. Otherwise, follow the build instructions above.)_

## 6. Test Credentials

### User Account (For Mobile App and Web)

- **Email:** `rajyavardhansing2003@gmail.com`
- **Password:** `123456789`

### Admin Account (For Web - Admin Panel)

- **Email:** `test@admin.com`
- **Password:** `123456789`

**Note:** The mobile application is intended for user roles only.

## 7. API Documentation

### Web API (`api.ts`)

- **Base URL:** `process.env.NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000/api`)
- **Authentication:** Uses Bearer token in the `Authorization` header. Token is stored in `localStorage`.

#### Endpoints:

**Auth (`/auth`)**

- `POST /login`: User login.
  - Request Body: `{ email, password }`
- `POST /register`: User registration.
  - Request Body: `{ /* user registration data */ }`
- `GET /profile`: Get current user's profile. (Requires Auth)
- `POST /logout`: User logout. (Requires Auth)

**Courses (`/courses`)**

- `GET /`: Get all courses.
- `GET /{id}`: Get a specific course by ID.
- `POST /`: Create a new course. (Requires Auth, typically admin)
  - Request Body: `{ /* course data */ }`
- `PUT /{id}`: Update a course by ID. (Requires Auth, typically admin)
  - Request Body: `{ /* updated course data */ }`
- `DELETE /{id}`: Delete a course by ID. (Requires Auth, typically admin)
- `POST /{id}/enroll`: Enroll in a course. (Requires Auth)
- `GET /{courseId}/enrollment-status`: Check enrollment status for a course. (Requires Auth)

**Sections (`/courses/{courseId}/sections`, `/sections/{sectionId}`)**

- `GET /courses/{courseId}/sections`: Get all sections for a course.
- `GET /sections/{sectionId}`: Get a specific section by ID.
- `POST /courses/{courseId}/sections`: Create a new section for a course. (Requires Auth, typically admin)
  - Request Body: `{ /* section data */ }`
- `PUT /sections/{sectionId}`: Update a section by ID. (Requires Auth, typically admin)
  - Request Body: `{ /* updated section data */ }`
- `DELETE /sections/{sectionId}`: Delete a section by ID. (Requires Auth, typically admin)

**Units (`/units/{unitId}`, `/courses/{courseId}/sections/{sectionId}/units`)**

- `GET /units/{unitId}`: Get a specific unit by ID.
- `POST /courses/{courseId}/sections/{sectionId}/units`: Create a new unit. (Requires Auth, typically admin)
  - Request Body: `{ /* unit data */ }`
- `PUT /courses/{courseId}/sections/{sectionId}/units/{unitId}`: Update a unit. (Requires Auth, typically admin)
  - Request Body: `{ /* updated unit data */ }`
- `DELETE /courses/{courseId}/sections/{sectionId}/units/{unitId}`: Delete a unit. (Requires Auth, typically admin)

**Chapters (`/chapters/{chapterId}`, `/courses/{courseId}/sections/{sectionId}/units/{unitId}/chapters`)**

- `GET /chapters/{chapterId}`: Get a specific chapter by ID.
- `POST /courses/{courseId}/sections/{sectionId}/units/{unitId}/chapters`: Create a new chapter. (Requires Auth, typically admin)
  - Request Body: `{ /* chapter data */ }`
- `PUT /courses/{courseId}/sections/{sectionId}/units/{unitId}/chapters/{chapterId}`: Update a chapter. (Requires Auth, typically admin)
  - Request Body: `{ /* updated chapter data */ }`
- `DELETE /courses/{courseId}/sections/{sectionId}/units/{unitId}/chapters/{chapterId}`: Delete a chapter. (Requires Auth, typically admin)

**Progress (`/progress`)**

- `GET /`: Get user's progress for all courses. (Requires Auth)
- `GET /{courseId}`: Get user's progress for a specific course. (Requires Auth)
- `PUT /{courseId}`: Update user's progress for a course. (Requires Auth)
  - Request Body: `{ /* progress data */ }`
- `POST /current-chapter/{courseId}`: Update the current chapter being viewed by the user for a course. (Requires Auth)
  - Request Body: `{ chapterId }`
- `POST /complete-chapter`: Mark a chapter as completed. (Requires Auth)
  - Request Body: `{ chapterId }`
- `POST /quiz`: Submit quiz answers for a chapter. (Requires Auth)
  - Request Body: `{ chapterId, answers }`
- `POST /answer`: Submit an answer (e.g., for a text-based question). (Requires Auth)
  - Request Body: `{ chapterId, answer }`

---

### Mobile App API (`api_service.dart`)

- **Base URL:** `http://192.168.0.12:5000/api` (Note: This IP might need to be changed based on your local network setup when testing with a physical device. For emulators, use `http://10.0.2.2:5000/api` for Android Emulator or `http://localhost:5000/api` for iOS Simulator if the backend is on the same machine.)
- **Authentication:** Uses a token stored via `flutter_secure_storage`. The token is sent in headers for authenticated requests.

#### Endpoints (derived from `ApiService` methods):

- **Auth**

  - `POST /auth/login`: User login.
    - Request Body: `{ "email": "...", "password": "..." }` (Based on `login(String email, String password)`)
  - `GET /auth/profile`: Get current user's profile. (Requires Auth)

- **Courses**

  - `POST /courses`: Create a new course. (Admin functionality, requires Auth)
    - Request Body: `{ /* courseData map */ }`
  - `GET /courses`: Fetch all courses.
  - `GET /courses/{courseId}`: Fetch a single course by ID.
  - `POST /courses/{courseId}/enroll`: Enroll in a course. (Requires Auth)

- **Progress**

  - `GET /progress`: Get user progress for all enrolled courses. (Requires Auth)
  - `GET /progress/{courseId}`: Get progress for a specific course. (Requires Auth)
  - `POST /progress/complete-chapter`: Mark a chapter as complete. (Requires Auth)
    - Request Body: `{ "chapterId": "..." }` (Inferred from web API, `api_service.dart` has `markChapterAsComplete(String chapterId)`)
  - `POST /progress/current-chapter/{courseId}`: Update current chapter for a course. (Requires Auth)
    - Request Body: `{ "chapterId": "..." }` (Inferred from web API, `api_service.dart` has `updateCurrentChapter(String courseId, String chapterId)`)

- **Sections**

  - `GET /courses/{courseId}/sections`: Fetch sections for a course.

- **Chapters**
  - `GET /chapters/{chapterId}`: Fetch a single chapter by ID.

**Note on Mobile API:** The `api_service.dart` file primarily implements methods for consuming these endpoints. The request/response bodies are inferred from the method signatures and common REST practices, cross-referenced with the web API where applicable.
