# Zabibu Fresh

Zabibu Fresh is a full-stack mobile application that connects farmers and buyers of fresh produce. It allows farmers to showcase their products and buyers to browse and purchase them directly. The application includes features for user authentication, product management, and real-time messaging between buyers and sellers.

## Table of Contents

- [About The Project](#about-the-project)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## About The Project

Zabibu Fresh aims to bridge the gap between farmers and consumers by providing a platform for direct communication and trade. This helps farmers get better prices for their produce and provides consumers with access to fresh, high-quality products.

## Key Features

- **User Authentication:** Secure user registration and login for both buyers and sellers.
- **Product Management:** Sellers can create, update, and delete product listings with images, descriptions, prices, and quantities.
- **Product Discovery:** Buyers can browse and search for products based on location and other criteria.
- **Real-time Messaging:** Buyers and sellers can communicate directly through the app to negotiate prices and arrange for delivery.
- **User Roles:** The application supports two user roles: `buyer` and `seller`, each with different permissions and capabilities.

## Technologies Used

### Backend

- **Supabase:** An open-source Firebase alternative for building secure and scalable backends.
- **PostgreSQL:** A powerful, open-source object-relational database system.
- **Prisma:** A next-generation ORM for Node.js and TypeScript.

### Frontend

- **React Native:** A popular framework for building native mobile apps with JavaScript and React.
- **Expo:** A framework and a platform for universal React applications.
- **Supabase JS Client:** The official JavaScript library for interacting with Supabase.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- **Node.js:** Make sure you have Node.js installed on your machine.
- **Expo CLI:** Install the Expo CLI globally by running `npm install -g expo-cli`.
- **Supabase Account:** Create a Supabase account and set up a new project.

### Installation

1. **Clone the repo:**
   ```sh
   git clone https://github.com/Stark-Priver/Zabibufresh-new
   ```
2. **Install NPM packages for the frontend:**
   ```sh
   cd zabibu-fresh/zabibu-fresh-app/frontend
   npm install
   ```
3. **Install NPM packages for the backend:**
   ```sh
   cd ../backend/prisma
   npm install
   ```
4. **Set up environment variables:**
   - Create a `.env` file in the `zabibu-fresh/zabibu-fresh-app/frontend` directory and add your Supabase project URL and anon key:
     ```
     EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
     EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
     ```
   - Create a `.env` file in the `zabibu-fresh/zabibu-fresh-app/backend/prisma` directory and add your Supabase database URL:
      ```
      DATABASE_URL=YOUR_DATABASE_URL
      ```

## Usage

1. **Start the frontend development server:**
   ```sh
   cd zabibu-fresh/zabibu-fresh-app/frontend
   expo start
   ```
2. **Run the app on your mobile device:**
   - Download the Expo Go app on your iOS or Android device.
   - Scan the QR code from the terminal to open the app.

## API Reference

The application uses the Supabase client library for all API interactions. The main functions are defined in `zabibu-fresh/zabibu-fresh-app/frontend/app/services/supabase.js`.

| Function | Description |
| --- | --- |
| `signUp(userData)` | Registers a new user. |
| `signIn(phone, password)` | Logs in an existing user. |
| `signOut()` | Logs out the current user. |
| `getProducts(sellerId)` | Fetches all products or products for a specific seller. |
| `createProduct(productData)` | Creates a new product. |
| `deleteProduct(productId)` | Deletes a product. |
| `getMessages(senderId, receiverId, productId)` | Fetches messages for a conversation. |
| `sendMessage(messageData)` | Sends a new message. |
| `getConversations(userId)` | Fetches all conversations for a user. |

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact


Project Link: [https://github.com/Stark-Priver/Zabibufresh-new](https://github.com/Stark-Priver/Zabibufresh-new)
