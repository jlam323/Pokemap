# PokeMap

PokeMap is a polished, grid-based 2D exploration game built with React, TypeScript, and Canvas. It features an immersive handheld console experience with multiple overlay modes and a vast pixel-art world to explore.

## 🌟 Features

- **🎮 Multi-Console Experience**: Switch seamlessly between GBC (Game Boy Color), GBA (Game Boy Advance), and Fullscreen "None" modes.
- **🗺️ Expansive Pixel World**: A large-scale map featuring varied terrain including grass, paths, and surfable water.
- **🎨 Sharp Pixel Rendering**: Specialized canvas rendering ensures the pixel art stays crisp and authentic on all screen sizes.
- **🤝 NPC Interactions**: Encounter characters throughout the world with interactive dialogue systems.
- **🛥️ Surfing Mechanic**: The character automatically switches to a boat sprite when moving onto water tiles.
- **📱 Responsive Handheld Shells**: Fully fluid GBC and GBA overlays that scale perfectly with your browser window, complete with interactive buttons.
- **⚡ Performance First**: Decoupled game engine and optimized render loop for smooth 60FPS gameplay.

## ⌨️ Controls

### Keyboard
- **Move**: `W`, `A`, `S`, `D` or Arrow Keys
- **Interact**: `SPACE` or `ENTER`

### Handheld Overlay
- Use the on-screen **D-Pad** for movement.
- Tap the **A** or **B** buttons for interactions.

## 🛠️ Technical Architecture

- **Game Engine**: A custom React hook (`useGameEngine`) managing movement interpolation, collision detection, and game state.
- **Renderer**: An isolated canvas rendering library (`renderer.ts`) for drawing sprites and environment tiles.
- **UI Components**: Modular components for console shells and dialogue systems.
- **Styling**: Tailwind CSS for responsive layouts and glassmorphism UI elements.

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 License

This project is for portfolio purposes.
