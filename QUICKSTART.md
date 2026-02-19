# Quick Start Guide

Get up and running with Tiler Quote App in minutes!

## For Users

### Installation

#### Option 1: Use Online
Simply visit [https://tiler-quote-app.vercel.app](https://tiler-quote-app.vercel.app) and start creating quotes!

#### Option 2: Install as App
1. Open the app in your browser
2. Look for "Install App" button at the top
3. Click to install as a native app on your device
4. Works offline!

### Your First Quote

1. **Go to Measure tab**
   - Enter customer details (name, address, email, phone)
   - Click "+ Add Room"

2. **Add measurements**
   - Select Floor or Wall
   - Choose a tile size (optional, helps calculate grout)
   - Enter room dimensions
   - Click "+ Enter Measurements"

3. **Select materials** (as needed)
   - Cement Board
   - Anti-Crack Membrane
   - Levelling Compound
   - Natural Stone Sealer
   - Underfloor Heating
   - And more!

4. **View Quote Summary**
   - See automatic calculations
   - View labour and materials costs
   - Toggle between Trader and Customer view

5. **Save & Share**
   - Click "💾 Save Quote" to store for later
   - Send via WhatsApp or Email
   - Export to FreeAgent (if connected)

### FreeAgent Integration

To export directly to FreeAgent:

1. Go to **Settings** tab
2. Scroll to "FreeAgent Integration"
3. Register app at [dev.freeagent.com](https://dev.freeagent.com)
4. Enter your Client ID and Client Secret
5. Click "🔗 Connect to FreeAgent"
6. Authorize the connection
7. Now you can export quotes directly!

---

## For Developers

### Prerequisites
- Node.js 16+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)
- Git

### Setup (5 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/tiler-quote-app.git
cd tiler-quote-app

# Install dependencies
npm install

# Start development server
npm start
```

The app opens at `http://localhost:3000` ✨

### Project Structure

```
src/
├── App.jsx                 # Main component (your editing focus)
├── index.js               # React entry point
└── index.css              # Global styles

public/
├── index.html             # HTML template
├── manifest.json          # PWA settings
└── sw.js                  # Service Worker

.github/
├── workflows/             # GitHub Actions (CI/CD)
└── ISSUE_TEMPLATE/        # Issue templates
```

### Making Your First Change

**Example: Change default labour rate**

1. Open `src/App.jsx`
2. Find this line (around line 850):
   ```javascript
   floorRate: 45,
   ```
3. Change `45` to your desired rate
4. The browser auto-refreshes!

### Useful Commands

```bash
npm start          # Start dev server
npm test           # Run tests
npm run build      # Build for production
npm run lint       # Check code quality
npm run format     # Auto-format code
```

### Development Workflow

1. **Create a branch** for your work
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** and test locally
   ```bash
   npm start
   ```

3. **Format & lint** before committing
   ```bash
   npm run format
   npm run lint
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug #123"
   ```

5. **Push and open Pull Request**
   ```bash
   git push origin feature/my-feature
   ```

### Key Files to Understand

- **App.jsx** - 1800+ line main component
  - State management (customer, rooms, rates)
  - FreeAgent integration
  - UI and calculations
  
- **public/sw.js** - Service Worker
  - Offline functionality
  - Caching strategy

- **public/manifest.json** - PWA settings
  - App name, icons, theme colors

### Common Tasks

#### Add a new material option
Find this section in App.jsx (around line 1200):
```javascript
<label className="flex items-center gap-1">
  <input type="checkbox" checked={room.useCementBoard||false}.../>
  Cement Board
</label>
```
Copy and adapt for your material.

#### Change styling
Find any `className="..."` in App.jsx and modify Tailwind classes:
```javascript
className="text-xs text-gray-600"  // Original
className="text-sm text-blue-700"  // Modified
```

#### Add new rate
In the `[rates, setRates]` state (around line 850), add:
```javascript
myNewRate: 25,  // Add this
```

### Testing Changes

**Manual Testing Checklist:**
- [ ] Can you add a room?
- [ ] Can you measure floor and walls?
- [ ] Do calculations work?
- [ ] Can you save a quote?
- [ ] Can you export to email?
- [ ] Does it work on mobile?

### Debugging

**Browser DevTools:**
```javascript
// Check localStorage (open browser console)
localStorage.getItem('rooms')
localStorage.getItem('customer')
localStorage.getItem('faConfig')
```

**Common Issues:**
- `localStorage full?` - Clear old data in Settings
- `FreeAgent not working?` - Check OAuth credentials
- `Calculations wrong?` - Verify material rates in Settings

### Next Steps

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines
- Check [Issues](../../issues) for tasks to work on
- Read code comments in App.jsx for implementation details
- Ask questions in Discussions!

### Learning Resources

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/) (animations)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## Need Help?

- 📖 Check [README.md](README.md) for detailed docs
- 🐛 [Report a bug](../../issues/new?template=bug_report.md)
- 💡 [Request a feature](../../issues/new?template=feature_request.md)
- 💬 [Start a discussion](../../discussions)

Happy coding! 🚀
