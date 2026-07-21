# Immersed (FocusBuddy) 🧠✨
### The ADHD-Friendly AI Teaching Assistant & Study Companion

**Immersed (FocusBuddy)** is a specialized, glassmorphic conversational dashboard designed to help students—especially those with ADHD—study, focus, and learn without feeling overwhelmed. By chunking complex explanations, rewarding focus gamification, and blocking auditory distractions, FocusBuddy turns study sessions into structured, engaging steps.

---

## 🚀 Key Features

### 1. ADHD-Optimized Conversational Feed
* **Scannable Chunking**: Responses from the AI are automatically reformatted into short paragraphs, with key concepts and terminology bolded or highlighted to enable quick reading and visual anchoring.
* **Clickable Follow-up Options**: Action suggestions (e.g. *Continue*, *Show an example*, *Quiz me*, *Draw a diagram*) are parsed dynamically and rendered as interactive buttons under messages to maintain momentum.
* **Faint Horizontal Dividers & Glassmorphic Tables**: Long text blocks are separated by clean, minimal dividers and visual tables for high-contrast, structured readability.

### 2. Gamified Pomodoro Focus Timer
* A circular countdown timer built into the right sidebar.
* **Plant Evolution Stages**: As focus intervals progress, a virtual seed evolves to reward focus sessions (`🌱` $\rightarrow$ `🌿` $\rightarrow$ `🪴` $\rightarrow$ `🌳` $\rightarrow$ `🌸` bloomed!).
* Emits a soft, browser-synthesized notification chime when the focus block completes.

### 3. Persistent Local Task Planner
* A study checklist allowing students to partition larger goals into smaller, bite-sized tasks.
* Saved locally via browser `localStorage` to ensure persistence across page refreshes.

### 4. Ambient Rainfall Synthesizer
* Built using the browser's native **Web Audio API**.
* Synthesizes waterfall/rainfall frequencies dynamically in real-time (using mathematical brown noise formulas) directly in the browser. 
* Operates entirely offline with **zero network dependencies** and zero media bandwidth usage.

### 5. Mindful Breathing Mascot Bubble
* Integrates a guided breathing widget (`Inhale` $\rightarrow$ `Hold` $\rightarrow$ `Exhale`) synced to a smooth Mascot bubble scaling animation to help center focus and lower testing anxiety.

### 6. Collapsible Double-Sidebar Layout
* Collapses sidebars smoothly via CSS Transitions to maximize visual space.
* **Focus Mode / DND Mode**: Collapses all panels in a single click, allowing students to focus solely on the active learning feed.

---

## 🛠️ Technology Stack

### Backend
* **FastAPI** (Python 3.10+) - Async web framework.
* **SQLAlchemy & aiosqlite** - Asynchronous database models and migration layers for SQLite database storage (`chatbot.db`).
* **LLM Engine Service** - Supports multiple providers (Mock GPT, OpenAI, OpenRouter, Groq, Anthropic) configured via runtime credentials.

### Frontend
* **React** (Vite ESM) - Single Page Application.
* **Vanilla CSS Layouts** - Pastel/glassmorphism design system utilizing CSS variables and keyframe animations.
* **Lucide Icons** - Clean, minimal stroke indicators.

---

## 💻 Installation & Setup

### Prerequisites
* **Python 3.10+**
* **Node.js v18+**

### 1. Start the Backend Server
```bash
cd backend
# 1. Create a virtual environment
python -m venv .venv
# 2. Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run database migrations and launch server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start the Frontend Server
```bash
cd frontend
# 1. Install dependencies
npm install

# 2. Run the Vite development server
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser to start learning!
