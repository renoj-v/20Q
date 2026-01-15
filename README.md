# 20 Questions Game

A web-based 20 Questions game powered by Claude AI, built with React and Vite.

## Overview

Play the classic 20 Questions game in two exciting modes:

- **AI Guesser Mode**: You think of an object, and Claude AI asks you questions to guess it
- **User Guesser Mode**: Claude AI thinks of an object, and you ask questions to guess it

## Features

- 🤖 Powered by Claude AI (Sonnet 4)
- 💬 Chat-like interface for natural conversation
- 📊 Question counter (max 20 questions)
- 🎮 Two game modes for different play styles
- 📱 Responsive design for mobile and desktop
- ♻️ Restart game functionality
- 🎨 Clean and intuitive UI

## Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)
- Anthropic API key ([Get one here](https://console.anthropic.com/))

## Installation

1. Clone or download this repository

2. Navigate to the project directory:
```bash
cd 20Q
```

3. Install dependencies:
```bash
npm install
```

4. Set up your API key:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and replace `your_api_key_here` with your actual Anthropic API key:
     ```
     VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
     ```

## Running the Application

Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:5173` (or another port if 5173 is busy).

## Building for Production

To create a production build:
```bash
npm run build
```

The optimized files will be in the `dist` directory.

To preview the production build:
```bash
npm run preview
```

## How to Play

### AI Guesser Mode
1. Select "AI Guesser" from the main menu
2. Think of any object (don't tell the AI!)
3. Answer the AI's yes/no questions honestly
4. See if Claude can guess your object within 20 questions

### User Guesser Mode
1. Select "User Guesser" from the main menu
2. Wait for Claude to think of an object
3. Ask yes/no questions to narrow down what it could be
4. Make your final guess before reaching 20 questions

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool and development server
- **Anthropic Claude API** - AI-powered conversation
- **Claude Sonnet 4** - Latest Claude model for optimal performance

## Project Structure

```
20Q/
├── src/
│   ├── components/
│   │   ├── ModeSelection.jsx       # Game mode selection screen
│   │   ├── ModeSelection.css
│   │   ├── AIGuesserMode.jsx       # AI guesses user's object
│   │   ├── UserGuesserMode.jsx     # User guesses AI's object
│   │   └── GameMode.css            # Shared game mode styles
│   ├── services/
│   │   └── claude.js               # Claude API integration
│   ├── App.jsx                     # Main app component
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .env                            # API key configuration (not in git)
├── .env.example                    # Example env file
├── .gitignore
├── package.json
└── README.md
```

## Important Notes

### API Key Security

- ⚠️ **Development Only**: This app uses the Anthropic SDK directly in the browser (`dangerouslyAllowBrowser: true`), which exposes your API key. This is acceptable for local development but **NOT for production**.

- For production deployment, you should:
  1. Create a backend server to handle API calls
  2. Store the API key securely on the server
  3. Have your frontend call your backend instead of Claude directly

### API Usage

- Each question and answer uses API calls to Claude
- Monitor your API usage in the [Anthropic Console](https://console.anthropic.com/)
- The app uses the `claude-sonnet-4-20250514` model

## Troubleshooting

### "API key is not configured" error
- Make sure you've created a `.env` file in the project root
- Verify your API key is correctly set as `VITE_ANTHROPIC_API_KEY`
- Restart the dev server after changing `.env` file

### API errors
- Check that your API key is valid and active
- Ensure you have sufficient API credits
- Verify your internet connection

### Build errors
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Make sure you're using Node.js version 16 or higher

## License

This project is open source and available for educational purposes.

## Credits

Built with [Claude AI](https://www.anthropic.com/claude) by Anthropic.
