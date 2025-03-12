# FlickShot: Basketball Physics Challenge

A physics-based basketball shooting game built with React Native and Expo. Swipe to shoot, navigate obstacles, and challenge yourself across multiple levels!

## Features

- 🏀 Physics-based basketball shooting mechanics
- 🎮 Intuitive swipe-to-shoot controls with trajectory prediction
- 🏆 Progressive difficulty with 20 challenging levels
- 🌟 3-star rating system for each level
- 🧩 Variety of obstacles and environmental effects
- 📊 High score tracking
- 🔊 Sound effects and visual feedback

## Tech Stack

- **React Native**: Core framework for cross-platform mobile development
- **Expo**: Simplified build and deployment process
- **Matter.js**: Physics engine for realistic ball movement
- **React Navigation**: Screen navigation
- **React Native Game Engine**: Game loop and entity management
- **AsyncStorage**: Local data persistence

## Project Structure

```
flickshot-basketball/
├── assets/                  # Images, sounds, and static resources
├── components/              # Reusable UI components
│   ├── Basketball.js        # Basketball rendering component
│   ├── Floor.js             # Floor/obstacle rendering component
│   └── Hoop.js              # Hoop rendering component
├── screens/                 # Main application screens
│   ├── GameScreen.js        # Main gameplay screen
│   ├── HomeScreen.js        # Welcome/menu screen
│   ├── LevelSelectScreen.js # Level selection menu
│   ├── ResultScreen.js      # Level completion screen
│   ├── SettingsScreen.js    # Settings screen
│   └── TutorialScreen.js    # How-to-play instructions
├── utils/                   # Utility functions
│   └── levelGenerator.js    # Level generation logic
├── App.js                   # Main app component
├── app.json                 # Expo configuration
└── package.json             # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Expo Go app on your physical device (for testing)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/glglak/flickshot-basketball.git
   cd flickshot-basketball
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Start the Expo development server:
   ```
   npm start
   # or
   yarn start
   ```

4. Run on a device or emulator:
   - Press `a` to run on an Android emulator
   - Press `i` to run on an iOS simulator
   - Scan the QR code with the Expo Go app on your device

## Publishing to Google Play Store

Follow these steps to publish your FlickShot game to the Google Play Store:

### 1. Set up your app credentials

1. Make sure your `app.json` has the correct Android package name:
   ```json
   "android": {
     "package": "com.yourcompany.flickshot",
     "versionCode": 1
   }
   ```

2. Replace placeholder app icons in the `assets` folder with your own icons.

### 2. Build the Android App Bundle (AAB)

#### Using Expo EAS Build (Recommended)

1. Install EAS CLI:
   ```
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```
   eas login
   ```

3. Configure your project:
   ```
   eas build:configure
   ```

4. Create an `eas.json` file in your project root:
   ```json
   {
     "build": {
       "production": {
         "android": {
           "buildType": "app-bundle"
         }
       }
     }
   }
   ```

5. Start the build process:
   ```
   eas build --platform android
   ```

6. The build will be processed on Expo's servers, and you'll receive a link to download the AAB file when it's complete.

### 3. Google Play Console Setup

1. Create a Google Play Console account if you don't have one
2. Set up a new application and fill in the store listing details
3. Upload your AAB file under "Production" > "Create new release"
4. Complete the content rating questionnaire
5. Set up pricing and distribution
6. Submit for review

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Basketball physics inspiration from various basketball games
- Obstacle design patterns from classic arcade games
