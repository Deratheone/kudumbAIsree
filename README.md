# 🏡 KudumbAIshree Frontend

An AI-powered Kerala sit-out chat experience built with React, TypeScript, and Vite.

**🏆 Competition Submission Ready** - API key is pre-configured for immediate testing by judges.

## 🌟 Features

- **AI-Powered Conversations**: 4 distinct Malayalam characters having natural conversations
- **Immersive Kerala Experience**: Authentic sit-out scene with traditional Kerala background
- **Real-time Chat**: Turn-based AI conversations with personality-driven responses
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Malayalam Integration**: Natural mix of Malayalam and English expressions

## 🎭 Characters

- **Babu** - Philosophical farmer who relates everything to nature
- **Aliyamma** - Caring grandmother with wisdom and stories
- **Mary** - Modern working woman balancing tradition and progress  
- **Chakko** - Cheerful neighbor who loves jokes and keeping spirits high

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173`

**Note:** API key is pre-configured for this competition submission. No additional setup required!

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **AI Integration**: Vercel AI SDK with Google Gemini
- **Styling**: Tailwind CSS + Custom CSS
- **Deployment**: Ready for Vercel

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── SitOutScene.tsx  # Main scene component
│   ├── Character.tsx    # Individual character component
│   ├── SpeechBubble.tsx # Speech bubble component
│   └── LoadingSpinner.tsx
├── hooks/              
│   └── useConversation.ts # Conversation state management
├── services/
│   └── aiService.ts     # OpenAI integration
├── data/
│   └── characters.ts    # Character definitions
└── styles/
    └── SitOut.css       # Custom styling
```

## 🎯 Usage

1. Click **"Start Chat"** to begin the conversation
2. Watch as characters take turns speaking naturally
3. Use **"Pause"** to stop the conversation flow
4. Use **"Reset"** to start a fresh conversation
5. Toggle **"Show Log"** to view conversation history

## 🔧 Configuration

The app uses Google's Gemini AI for generating character responses. Each character has:
- Unique personality prompts
- Malayalam expression patterns
- Fallback responses for offline usage
- Distinct conversation styles

**For Competition:** The API key is hardcoded in the source code for easy testing by judges.

## 📱 Responsive Features

- Mobile-optimized interface
- Touch-friendly controls
- Adaptive speech bubble positioning
- Scalable character indicators

## 🎨 Customization

You can customize:
- Character personalities in `src/data/characters.ts`
- Visual styling in `src/styles/SitOut.css`
- Background image in `public/background.jpeg`
- Conversation timing in `src/hooks/useConversation.ts`

---

**നമ്മുടെ പഴയ കൂട്ടുകാരുടെ കൂടെ ഇരിക്കാം** - Come sit with our old friends!
