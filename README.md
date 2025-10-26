# Recipe Vibe

A modern, full-featured recipe management application built with React and Firebase. Create, organize, and share your favorite recipes with a beautiful dark-themed interface.

## ✨ Features

### Core Features
- **Google Authentication**: Secure sign-in with Google accounts
- **Real-time Recipe Management**: Add, edit, and delete recipes with instant updates
- **Inline Editing**: Edit recipes directly within recipe cards
- **Auto-expanding Text Areas**: Dynamic text fields that resize automatically
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Social Features
- **User Discovery**: Browse and connect with other food enthusiasts
- **Follow System**: Follow users to stay updated with their recipes
- **User Profiles**: View detailed profiles with recipe collections
- **Profile Customization**: 
  - Editable display name with real-time updates
  - Custom profile photo upload with automatic cleanup
  - Photo validation (JPG, PNG, GIF, WebP up to 5MB)

### Advanced Features
- **Storage Quota Management**: 
  - Per-user limits (100MB per user)
  - Project-wide limit tracking (5GB free tier)
  - Automatic old photo cleanup (keeps 5 most recent)
  - Storage recalculation utility
- **Tabbed Interface**: Clean organization across Add Recipe, My Recipes, and Discover Users
- **Real-time Synchronization**: Profile updates propagate to all followers instantly

## 🛠️ Technology Stack

- **Frontend**: React 18 with Hooks and Context API
- **Backend**: Firebase Firestore (NoSQL database)
- **Storage**: Firebase Storage for profile photos
- **Authentication**: Firebase Auth with Google provider
- **Styling**: Custom CSS with modern dark theme
- **Routing**: React Router DOM v6
- **Build Tool**: Create React App

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Firebase project with:
  - Authentication enabled (Google provider)
  - Firestore database
  - Storage bucket

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/recipe-vibe-react.git
   cd recipe-vibe-react
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

4. Deploy Firebase security rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

5. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/           # Authentication components
│   │   └── GoogleSignIn.js
│   ├── Layout/         # Layout components
│   │   ├── Header.js   # Header with profile management
│   │   └── MainContent.js
│   ├── Recipe/         # Recipe management
│   │   ├── AddRecipeForm.js
│   │   ├── RecipeCard.js
│   │   └── RecipeList.js
│   ├── User/           # User features
│   │   ├── UserCard.js
│   │   ├── UserProfile.js
│   │   └── UsersList.js
│   └── UI/             # Reusable UI components
│       ├── EmptyState.js
│       ├── LoadingState.js
│       └── Tabs.js
├── context/
│   └── AuthContext.js  # Authentication state management
├── hooks/
│   ├── useRecipes.js   # Recipe data hook
│   ├── useUsers.js     # User management hook
│   └── useUserRecipes.js
├── services/
│   └── firebase.js     # Firebase configuration
├── utils/
│   └── storageQuota.js # Storage management utilities
├── App.js
├── App.css
└── index.js
```

## 🔒 Firebase Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User recipes
    match /artifacts/{appId}/users/{userId}/recipes/{recipeId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User profiles (read by all, write by owner)
    match /artifacts/{appId}/users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Following relationships
    match /artifacts/{appId}/users/{userId}/following/{followId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Storage metadata
    match /artifacts/{appId}/metadata/storage {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile-photos/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null 
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📖 Usage Guide

1. **Sign In**: Click "Continue with Google" to authenticate
2. **Add Recipes**: 
   - Navigate to "Add Recipe" tab
   - Fill in recipe name, ingredients, and instructions
   - Click "Add Recipe" to save
3. **Manage Recipes**: 
   - View all recipes in "My Recipes" tab
   - Hover over recipe cards to see edit/delete options
   - Click edit icon to modify inline
4. **Profile Management**:
   - Click your name in header to edit display name
   - Click profile photo to upload new image
   - Changes sync to all followers automatically
5. **Discover Users**:
   - Browse users in "Discover Users" tab
   - Click "Follow" to connect
   - Click user card to view their recipe collection

## 🎨 Key Features Details

### Profile Photo Management
- Supports JPG, PNG, GIF, WebP formats
- Maximum file size: 5MB
- Automatic cleanup of old photos (keeps 5 most recent)
- Real-time updates across the application

### Storage Quota System
- Per-user limit: 100MB
- Project-wide limit: 5GB (Firebase free tier)
- Automatic quota checking before uploads
- Recalculation utility for existing storage

### Social Features
- Real-time follower count
- Profile synchronization across all followers
- User-specific recipe collections
- Follow/unfollow functionality

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Other Platforms
The build folder can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Firebase for backend services
- React team for the amazing framework
- Bootstrap Icons for UI icons
- All contributors and users

## 📧 Contact

For questions or support, please open an issue on GitHub.