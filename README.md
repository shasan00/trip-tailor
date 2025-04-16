# TripTailor

## Project Description

TripTailor is a web application designed to help users plan vacations or any general trip more easily. Making a quality itinerary can be time-consuming and somewhat of a gamble, especially when visiting unfamiliar destinations. TripTailor aims to alleviate the stress that comes with planning and make it a simpler, better experience.

The basis of this application is to crowdsource trip planning to the community; ideally, locals or past visitors could share their 'field-tested' itineraries for other people to use. Users can search for itineraries based on location, duration, and price range. Obviously, users can create their own itineraries to share, which can include food places, activities, photos, and a map detailing stops, their proximity to each other, and the sequential route from one stop to another.

Additionally, an AI chatbot will be available to consult with. This chatbot can be used to aid users in finding itineraries that best fit their needs or preferences.

Finally, users will be able to rate and leave reviews on itineraries. This will add additional credibility to posted itineraries and ensure other users are well informed when planning their own trips.

## Key Features

*   **Itinerary Search:** Find itineraries based on destination, duration, and price.
*   **Itinerary Creation:** Create and share detailed itineraries with stops (activities, food, accommodation, transport), descriptions, photos, and map integration.
*   **Community Driven:** Browse itineraries created by other users, locals, or past visitors.
*   **User Reviews & Ratings:** Rate and review itineraries to help others.
*   **Favorites:** Save preferred itineraries for later reference.
*   **AI Chatbot:** Get personalized itinerary suggestions based on preferences (planned feature).
*   **Interactive Maps:** Visualize itinerary stops and routes (planned feature using Google Maps API).
*   **User Authentication:** Secure registration and login for users.
*   **Admin Management:** Interface for administrators to manage users, itineraries, and reviews.

## Technology Stack

*   **Frontend:** React, Next.js (with Turbopack), TypeScript, Tailwind CSS, Shadcn/UI
*   **Backend:** Python, Django, Django REST Framework
*   **Database:** SQLite (default for development)
*   **APIs:**
    *   Google Maps API (for location search, mapping, geocoding)
    *   OpenAI API (planned for AI chatbot features)

## Setup Instructions

### Prerequisites

*   Node.js and npm (or yarn)
*   Python 3.x and pip
*   Git

### Backend Setup (`tripbackend`)

1.  **Navigate to the backend directory:**
    ```bash
    cd tripbackend
    ```
2.  **Create and activate a virtual environment:**
    *   On macOS/Linux:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```
    *   On Windows:
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```
3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Apply database migrations:**
    ```bash
    python manage.py migrate
    ```
5.  **Environment Variables:**
    *   Create a `.env` file in the `tripbackend` directory.
    *   Add necessary backend environment variables, such as:
        ```env
        SECRET_KEY='your_django_secret_key'
        # Add other variables like database URLs if not using SQLite, OpenAI key, etc.
        ```
    *   *Note:* A strong `SECRET_KEY` is crucial for production.

### Frontend Setup (`tripfrontend`)

1.  **Navigate to the frontend directory:**
    ```bash
    cd ../tripfrontend
    # Or from the root: cd tripfrontend
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    # Or if you use yarn: yarn install
    ```
3.  **Environment Variables:**
    *   Create a `.env.local` file in the `tripfrontend` directory.
    *   Add necessary frontend environment variables:
        ```env
        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY='your_google_maps_api_key'
        # Add other public variables prefixed with NEXT_PUBLIC_
        ```
    *   Ensure your Google Maps API key has the necessary APIs enabled (Places API, Geocoding API, Maps JavaScript API).

## Running the Development Servers

You need to run both the backend and frontend servers simultaneously.

1.  **Run the Backend Server:**
    *   Open a terminal in the `tripbackend` directory (with the virtual environment activated).
    *   Run the Django development server:
        ```bash
        python manage.py runserver
        ```
    *   The backend API will typically be available at `http://localhost:8000`.

2.  **Run the Frontend Server:**
    *   Open a *separate* terminal in the `tripfrontend` directory.
    *   Run the Next.js development server:
        ```bash
        npm run dev
        ```
    *   The frontend application will typically be available at `http://localhost:3000`.

Open `http://localhost:3000` in your browser to view the application.

## API Information

*   The backend exposes a REST API (built with Django REST Framework) under `/api/`. Key endpoints likely include `/api/itineraries/`, `/api/register/`, `/api/login/`, etc.
*   The frontend interacts with this backend API and the Google Maps API.