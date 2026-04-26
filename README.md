# Live Puzzle App

An interactive, webcam-driven puzzle game built with **Next.js (App Router)**, **Framer Motion**, and **MediaPipe Hand Tracking**. Users capture a photo of themselves using a pinch gesture, which slices into a 3x3 grid. They then drag and drop the pieces into place using their hands!

## Tech Stack
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Hand Tracking:** MediaPipe (via CDN scripts)
- **Database:** MongoDB (Mongoose)
- **Icons:** Lucide React

## Local Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup MongoDB**
   You need a MongoDB instance running (either locally or on MongoDB Atlas). 
   Create a `.env.local` file in the root directory and add your connection string:
   ```env
   MONGODB_URI="mongodb://localhost:27017/live-puzzle"
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Play!**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

1. **Capture Phase:**
   - Allow the browser to access your webcam.
   - Position your hand inside the central dashed box.
   - **Pinch your thumb and index finger together** to take a picture.
   - The picture will automatically slice into 9 pieces and shuffle.

2. **Playing Phase:**
   - A virtual cursor will follow your hand movement (mirrored for ease of use).
   - Move the cursor over a puzzle piece and **pinch** to grab it.
   - Drag the piece over another slot and **release the pinch** to swap their positions.
   - Arrange all 9 pieces into their original order to win!

3. **Leaderboard:**
   - When completed, your time is paused.
   - Enter your name to submit your score to the MongoDB database.
   - Click "Skip & Play Again" to jump back to the capture screen.
