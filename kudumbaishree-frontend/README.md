# 🏡 KudumbAIshree Frontend

An AI-powered Kerala sit-out chat experience built with React, TypeScript, and Vite.

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

2. **Add your OpenAI API key:**
   Create a `.env.local` file and add:
   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **AI Integration**: Vercel AI SDK with OpenAI GPT-4
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

The app uses OpenAI's GPT-4 for generating character responses. Each character has:
- Unique personality prompts
- Malayalam expression patterns
- Fallback responses for offline usage
- Distinct conversation styles

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
