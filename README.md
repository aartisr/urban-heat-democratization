# Spectral Urbanism: Urban Thermal Math Lab & GMRF Graph Evaluator

An interactive computational framework and simulation lab for exploring urban thermodynamics, microclimate energy budgets, street canyon radiative trapping, and Gaussian Markov Random Field (GMRF) spatial thermal diffusion.

![Urban Thermal Math Lab](https://img.shields.io/badge/React-18-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan) ![KaTeX](https://img.shields.io/badge/KaTeX-LaTeX-amber) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## 🌟 Overview

The **Urban Thermal Math Lab** bridges urban climate theory and interactive numerical simulation. It provides 6 interactive laboratory modules, a step-by-step 4-node GMRF graph toy example, a 1D point physics evaluator, and a Gemini-powered AI Tutor with KaTeX mathematical typesetting.

---

## 🔬 Interactive Lab Modules

1. **Lab 1: Basic Urban Heat Island (UHI)**
   - Calculates total microclimate temperature elevation $\Delta T_{\text{UHI}}$ based on albedo, vegetation fraction, anthropogenic heat $Q_F$, and wind speed.
2. **Lab 2: Net Radiation ($R_n$) & Diurnal Energy Budget**
   - Computes shortwave $K_{\text{net}}$ and longwave $L_{\text{net}}$ radiative flux components:
     $$R_n = K_{\downarrow}(1 - \alpha) + \varepsilon_s \sigma T_{\text{atm}}^4 - \varepsilon_s \sigma T_s^4$$
3. **Lab 3: Energy Flux Partitioning & Bowen Ratio ($\beta$)**
   - Evaluates the surface energy balance and heat partitioning into Sensible Heat ($H$), Latent Heat ($LE$), and Ground Heat Storage ($G$):
     $$R_n + Q_F = H + LE + G \quad \text{where} \quad \beta = \frac{H}{LE}$$
4. **Lab 4: Material Thermal Inertia ($P$) & Nocturnal UHI Peak**
   - Models heat storage and 24-hour diurnal temperature lags using material thermal inertia $P = \sqrt{k \rho c_p}$.
5. **Lab 5: Street Canyon Geometry & Sky View Factor (SVF)**
   - Quantifies longwave radiation trapping inside urban street canyons as a function of height-to-width ratio ($H/W$):
     $$\text{SVF} = \cos\left(\arctan\left(\frac{2H}{W}\right)\right)$$
6. **Lab 6: Gaussian Markov Random Field (GMRF) & Spatial Thermal Graph**
   - Models neighborhood microclimates as a spatial stochastic graph $\mathbf{T} \sim \mathcal{N}(\boldsymbol{\mu}, \mathbf{Q}^{-1})$ with precision matrix $\mathbf{Q} = \tau(\mathbf{I} + \kappa^2 \mathbf{L})$.
   - Includes an interactive **4-Node Toy Graph Example** for step-by-step matrix evaluation (Adjacency $\mathbf{A}$, Laplacian $\mathbf{L}$, Precision $\mathbf{Q}$, and Gauss-Seidel heat diffusion iterations).

---

## 🚀 Quick Start & How to Run

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd urban-thermal-math-lab
npm install
```

### 2. Environment Setup (Optional for AI Tutor)

Create a `.env` file in the root directory if you wish to enable the Gemini AI Tutor:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

*(Note: The simulation labs, KaTeX math displays, and GMRF graph models run completely offline client-side without needing an API key).*

### 3. Run Development Server

Start the local development server:

```bash
npm run dev
```

The application will launch on **`http://localhost:3000`**.

### 4. Build for Production

To create an optimized production build:

```bash
npm run build
```

### 5. Start Production Server

To run the built CJS server in production mode:

```bash
npm start
```

---

## 🌿 Git Branch Setup Instructions

To push this codebase to a new branch (e.g. `feature/urban-thermal-lab`):

```bash
# 1. Initialize git repository (if not already initialized)
git init

# 2. Add all files to staging
git add .

# 3. Create initial commit
git commit -m "feat: Urban Thermal Math Lab & GMRF 4-node graph toy example"

# 4. Create and switch to new branch 'feature/urban-thermal-lab'
git checkout -b feature/urban-thermal-lab

# 5. Connect to remote repository and push
git remote add origin <your-git-repo-url>
git push -u origin feature/urban-thermal-lab
```

---

## 📁 Repository Structure

```
.
├── src/
│   ├── components/
│   │   ├── MathFormula.tsx          # KaTeX LaTeX renderer & LaTeXText parser
│   │   ├── GraphNodeToyExample.tsx  # Interactive 4-Node GMRF Graph Toy Example
│   │   ├── InteractiveToyCalculator.tsx # Progressive math step evaluator
│   │   ├── FormulaCard.tsx          # KaTeX formatted formula display cards
│   │   ├── Lab1BasicUHI.tsx         # Lab 1: UHI Canopy & Energy Balance
│   │   ├── Lab2Radiation.tsx        # Lab 2: Net Radiation & Flux
│   │   ├── Lab3EnergyBalance.tsx    # Lab 3: Bowen Ratio & Energy Fluxes
│   │   ├── Lab4ThermalInertia.tsx   # Lab 4: Thermal Inertia & Diurnal Lag
│   │   ├── Lab5UrbanCanyon.tsx      # Lab 5: Sky View Factor & Trapping
│   │   ├── Lab6GMRFGraph.tsx        # Lab 6: GMRF Matrix & 8x8 City Grid
│   │   ├── ScenarioSandbox.tsx      # Urban Greening Mitigation Scenario Sandbox
│   │   └── AITutorModal.tsx         # AI Physics Tutor with KaTeX support
│   ├── lib/
│   │   ├── thermalMath.ts           # Urban thermodynamic & physics calculations
│   │   └── gmrfGraph.ts             # GMRF precision matrix & Gauss-Seidel solver
│   ├── types.ts                     # TypeScript interfaces & types
│   ├── App.tsx                      # Main navigation & lab shell
│   ├── main.tsx                     # Entry point with KaTeX CSS imports
│   └── index.css                    # Tailwind CSS & KaTeX dark mode styles
├── package.json                     # Dependencies & scripts
├── server.ts                        # Express server with Vite middleware
├── vite.config.ts                   # Vite configuration
└── README.md                        # Documentation
```

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Dark theme with Amber/Emerald accents)
- **Mathematical Typesetting**: KaTeX (`katex`)
- **Data Visualization**: Recharts & SVG canvas
- **Icons**: Lucide React (`lucide-react`)
- **AI Integration**: `@google/genai` (Gemini API)
