# Recipe Vibe

Recipe Vibe is a modern web application that allows users to create, manage, and organize their favorite recipes. Built with React and Firebase, it provides a seamless experience for authenticated users to manage their personal recipe collection with real-time updates and intuitive inline editing.

## Features

- **Google Authentication**: Secure sign-in with Google accounts
- **Real-time Recipe Management**: Add, edit, and delete recipes with instant updates
- **Inline Editing**: Edit recipes directly within recipe cards without modals
- **Auto-expanding Text Areas**: Text fields automatically resize to show all content
- **Responsive Design**: Optimized for desktop and mobile devices
- **Tabbed Interface**: Clean organization with separate tabs for adding and viewing recipes
- **Firebase Integration**: Secure cloud storage with real-time synchronization
- **Modern UI**: Dark theme with smooth animations and hover effects

## Technology Stack

- **Frontend**: React 18 with Hooks and Context API
- **Backend**: Firebase Firestore (NoSQL database)
- **Authentication**: Firebase Auth with Google provider
- **Styling**: Custom CSS with Tailwind-inspired utility classes
- **Routing**: React Router DOM
- **Build Tool**: Create React App

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/recipe-vibe-react.git
   ```

2. Navigate to the project directory:
   ```bash
   cd recipe-vibe-react
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. Set up Firebase configuration:
   - Create a `.env` file in the root directory
   - Copy the contents from `.env.example`
   - Fill in your Firebase configuration values:
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

### Running the Application

To start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

### Building for Production

To create a production build:
```bash
npm run build
```

This will generate an optimized build in the `build` folder ready for deployment.

## Usage

1. **Sign In**: Use your Google account to authenticate
2. **Add Recipes**: Use the "Add Recipe" tab to create new recipes
3. **View Recipes**: Switch to "My Recipes" tab to see your collection
4. **Edit Recipes**: Hover over any recipe card and click the edit icon to modify inline
5. **Delete Recipes**: Use the delete icon with confirmation for safe removal

## Project Structure

```
src/
├── components/
│   ├── Auth/           # Authentication components
│   ├── Layout/         # Layout components (Header, MainContent)
│   ├── Recipe/         # Recipe-related components
│   └── UI/             # Reusable UI components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── services/           # Firebase configuration
├── App.js              # Main application component
├── App.css             # Application styles
└── index.js            # Application entry point
```

## Firebase Security Rules

Ensure your Firestore security rules allow authenticated users to access their own recipes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/recipes/{recipeId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- Built with Create React App
- Authentication powered by Firebase Auth
- Database powered by Firebase Firestore
- Icons from Bootstrap Icons