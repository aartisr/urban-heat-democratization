# Urban Thermal Math & Spatial Graph Analytics: The Complete "Dummies Guide"

This guide breaks down advanced mathematical concepts, formulas, and analytical
tools used in urban thermal remote sensing, spectral graph theory, and spatial
statistics into plain English. Every numbered concept has three worked
examples directly in its section, followed by an appendix that traces the
concept to its app implementation status.

> **Accuracy and implementation boundary (read first).** A formula in this
> guide is not automatically an active product calculation or a validated local
> claim. The current app actively constructs a weighted raster-cell graph from
> prepared LST and optional NDVI, then derives a normalized-Laplacian/Fiedler
> sweep, modeled least-cost linkage to inferred cooling sinks, and stress-test
> metrics. Its LISA layer is a gated, single-scene computational preview.
> Radiometric calibration, FVC/emissivity, split-window LST, clustering,
> probability, Markov, GEV, min-cut, and exposure methods are reusable
> framework or research primitives unless a city package supplies the required
> inputs and validation. See [Math Innovation Accountability](MATH_INNOVATION_ACCOUNTABILITY.md)
> for the authoritative implementation status. Land-surface temperature is not
> indoor temperature, personal heat exposure, or a health-risk diagnosis.

> 🟦 **◆ INNOVATION — visual key.** The blue callouts labelled **◆ INNOVATION**
> identify the app's product/integration innovation: transparent composition of
> established methods, map artifacts, explanation, and release gates. They do
> **not** claim to have invented the underlying mathematics. **◇ FRAMEWORK**
> means tested code exists but is not a current public city result; **○ GATED**
> means external data, validation, or governance is still required.

---

## Table of Contents

1. [Radiometric Calibration & Thermal Math](#1-radiometric-calibration--thermal-math)
   - 1.1 Digital Numbers (DN) to TOA Radiance
   - 1.2 Top-of-Atmosphere (TOA) Brightness Temperature & Planck's Law
   - 1.3 Normalized Difference Vegetation Index (NDVI)
   - 1.4 Fractional Vegetation Cover ($P_v$ / FVC)
   - 1.5 Land Surface Emissivity ($\varepsilon$)
   - 1.6 Single-Channel Emissivity-Corrected LST
   - 1.7 Split-Window Algorithm (SWA) LST
2. [Graph Theory & Network Math](#2-graph-theory--network-math)
   - 2.1 Adjacency Matrix ($A$)
   - 2.2 Degree Matrix ($D$)
   - 2.3 Unnormalized Graph Laplacian ($L = D - A$)
   - 2.4 Symmetric Normalized Graph Laplacian ($L_{\text{sym}}$)
3. [Spectral Graph Theory & Clustering](#3-spectral-graph-theory--clustering)
   - 3.1 Fiedler Vector & Fiedler Value ($\lambda_2$)
   - 3.2 Cheeger Constant ($\text{h}(G)$ / Isoperimetric Constant)
   - 3.3 Cheeger Cut & Cheeger Inequality
   - 3.4 Spectral Clustering Algorithm
   - 3.5 Modularity ($Q$) & Graph Partitioning
4. [Probability, Statistics & Spatial Risk Modeling](#4-probability-statistics--spatial-risk-modeling)
   - 4.1 Global Moran's I (Spatial Autocorrelation)
   - 4.2 Local Moran's I (LISA / Spot Detection)
   - 4.3 Probability Density Functions (PDFs) for Heat Waves
   - 4.4 Joint & Conditional Probabilities of Thermal Vulnerability
   - 4.5 Markov Chains & Land-Use Transition Matrices
   - 4.6 Extreme Value Theory (Generalized Extreme Value / GEV Distribution)
   - 4.7 Risk & Population Exposure Modeling
5. [Combinatorics & Graph Optimization](#5-combinatorics--graph-optimization)
   - 5.1 Combinatorial Graph Cuts
   - 5.2 Minimum Cut / Maximum Flow Algorithm
   - 5.3 Permutations & Combinations for Spatial Subgraphs
   - 5.4 NP-Hard Partitioning & Greedy Heuristics
6. [Plain-English Symbols & Units](#appendix-b--plain-english-symbols--units-for-every-formula)

---

# 1. Radiometric Calibration & Thermal Math

---

### 1.1 Digital Numbers (DN) to TOA Radiance

#### 💡 What is this in plain English?
Satellites store images as raw digital pixels called **Digital Numbers (DN)** (e.g., integers from 0 to 65,535). To do thermal science, we convert these unitless pixel values into **Top-of-Atmosphere (TOA) Radiance** ($L_\lambda$), which measures physical light and heat energy reaching the satellite sensor.

Its units are **watts per square metre per steradian per micrometre**:

$$\text{W}\cdot\text{m}^{-2}\cdot\text{sr}^{-1}\cdot\mu\text{m}^{-1}$$

- **W (watts):** radiant power, or energy per second.
- **m⁻² (per square metre):** power normalized by the sensor-facing ground area.
- **sr⁻¹ (per steradian):** power normalized by viewing direction / solid angle.
- **μm⁻¹ (per micrometre):** power normalized by a narrow wavelength interval.

Together, the units say: “how much radiant power from a unit area arrives at
the sensor from a unit viewing direction, within a one-micrometre-wide band of
wavelengths.”

#### 📐 The Math Formula
$$L_\lambda = M_L \cdot \text{DN} + A_L$$

* $M_L$: Radiance multiplicative scaling factor (from metadata).
* $A_L$: Radiance additive scaling factor (from metadata).

#### 🧪 Example 1: Sunny Asphalt Parking Lot
* **Given:** $M_L = 0.0003342$, $A_L = 0.10000$, $\text{DN} = 32,500$.
1. Multiply: $32,500 \times 0.0003342 = 10.8615$
2. Add offset: $10.8615 + 0.10000 = 10.9615$
* **Result:** $L_\lambda = \mathbf{10.9615}\text{ W}\cdot\text{m}^{-2}\cdot\text{sr}^{-1}\cdot\mu\text{m}^{-1}$.

#### 🧪 Example 2: Dense Forest Canopy
* **Given:** $M_L = 0.0003342$, $A_L = 0.10000$, $\text{DN} = 22,000$.
1. Multiply: $22,000 \times 0.0003342 = 7.3524$
2. Add offset: $7.3524 + 0.10000 = 7.4524$
* **Result:** $L_\lambda = \mathbf{7.4524}\text{ W}\cdot\text{m}^{-2}\cdot\text{sr}^{-1}\cdot\mu\text{m}^{-1}$.

#### 🧪 Example 3: Nighttime / Fill-Value Guard
* **Given:** a pixel has no valid thermal DN after quality masking.
* **Calculation:** do not apply a scale factor to a fill value.
* **Result:** the analysis keeps this cell as **missing**, rather than inventing a radiance value. In the app, raw-DN conversion is framework-ready and requires a declared product adapter.

---

### 1.2 Top-of-Atmosphere (TOA) Brightness Temperature & Planck's Law

#### 💡 What is this in plain English?
**Brightness Temperature ($T_b$)** is the temperature an object *appears* to have if it radiates heat as a perfect "blackbody" (an idealized object that absorbs and emits 100% of radiation). It uses the inverse of **Planck's Radiation Law** to turn energy ($L_\lambda$) directly into temperature ($K$ or $\text{°C}$).

#### 📐 The Math Formula
$$T_b = \frac{K_2}{\ln\left(\frac{K_1}{L_\lambda} + 1\right)} - 273.15$$

* $K_1, K_2$: Calibration constants (For Landsat 8 Band 10: $K_1 = 774.8853$, $K_2 = 1321.0789$).

The displayed equation subtracts $273.15$ and therefore returns Celsius. The
repository function `brightness_temperature_kelvin` intentionally returns
Kelvin; convert units explicitly at the downstream boundary.

#### 🧪 Example 1: Concrete Mall ($L_\lambda = 10.9615$)
1. Ratio: $774.8853 / 10.9615 = 70.6915$
2. Log argument: $70.6915 + 1 = 71.6915$
3. Natural Log: $\ln(71.6915) = 4.2724$
4. Temperature (K): $1321.0789 / 4.2724 = 309.21\text{ K}$
5. Convert to Celsius: $309.21 - 273.15 = 36.06\text{°C}$
* **Result:** $T_b = \mathbf{36.06\text{°C}}$.

#### 🧪 Example 2: Dense Forest ($L_\lambda = 7.4524$)
1. Ratio: $774.8853 / 7.4524 = 103.9779$
2. Log argument: $103.9779 + 1 = 104.9779$
3. Natural Log: $\ln(104.9779) = 4.6537$
4. Temperature (K): $1321.0789 / 4.6537 = 283.88\text{ K}$
5. Convert to Celsius: $283.88 - 273.15 = 10.73\text{°C}$
* **Result:** $T_b = \mathbf{10.73\text{°C}}$.

#### 🧪 Example 3: Keep Kelvin Until the Final Conversion
* **Given:** the inverse-Planck calculation returns $T_b = 300.00\text{ K}$.
1. Convert only at the display boundary: $300.00 - 273.15 = 26.85\text{°C}$.
* **Result:** brightness temperature is $300.00\text{ K}$ or $26.85\text{°C}$; the repository helper deliberately returns Kelvin first.

---

### 1.3 Normalized Difference Vegetation Index (NDVI)

#### 💡 What is this in plain English?
**NDVI** measures green vegetation density. Healthy green leaves absorb Red light for photosynthesis and strongly reflect Near-Infrared (NIR) light to avoid overheating. Concrete, bare ground, and water bounce back light very differently.
* $+1.0$: Thick forest.
* $0.0$: Concrete/asphalt.
* $-1.0$: Water.

#### 📐 The Math Formula
$$\text{NDVI} = \frac{\text{NIR} - \text{RED}}{\text{NIR} + \text{RED}}$$

#### 🧪 Example 1: Suburban Golf Course
* **Given:** $\text{NIR} = 0.55$, $\text{RED} = 0.05$.
1. Difference: $0.55 - 0.05 = 0.50$
2. Sum: $0.55 + 0.05 = 0.60$
3. Ratio: $0.50 / 0.60 = 0.833$
* **Result:** $\text{NDVI} = \mathbf{0.833}$ (Very green plant cover).

#### 🧪 Example 2: Urban Highway Interchange
* **Given:** $\text{NIR} = 0.15$, $\text{RED} = 0.20$.
1. Difference: $0.15 - 0.20 = -0.05$
2. Sum: $0.15 + 0.20 = 0.35$
3. Ratio: $-0.05 / 0.35 = -0.143$
* **Result:** $\text{NDVI} = \mathbf{-0.143}$ (Non-vegetated pavement).

#### 🧪 Example 3: No-Divide-by-Zero Pixel
* **Given:** $\text{NIR} = 0.00$, $\text{RED} = 0.00$.
1. Denominator: $0.00 + 0.00 = 0.00$.
* **Result:** NDVI is **not available** (`NaN`), not zero. The calculation requires a non-zero compatible-band sum.

---

### 1.4 Fractional Vegetation Cover ($P_v$ / FVC)

#### 💡 What is this in plain English?
A single satellite pixel ($30\text{m} \times 30\text{m}$) usually contains a mixture of concrete, soil, and grass. **Fractional Vegetation Cover ($P_v$)** is a model-based proxy ($0$ to $1$) for vegetated cover within that mixed pixel. It is not an exact canopy percentage unless independently calibrated for the sensor, place, and season.

#### 📐 The Math Formula
$$P_v = \left( \frac{\text{NDVI} - \text{NDVI}_{\min}}{\text{NDVI}_{\max} - \text{NDVI}_{\min}} \right)^2$$

* $\text{NDVI}_{\min} = 0.20$ (pure soil), $\text{NDVI}_{\max} = 0.80$ (pure dense foliage).

#### 🧪 Example 1: Suburban Residential Street ($\text{NDVI} = 0.44$)
1. Numerator: $0.44 - 0.20 = 0.24$
2. Denominator: $0.80 - 0.20 = 0.60$
3. Unsquared fraction: $0.24 / 0.60 = 0.40$
4. Square it: $(0.40)^2 = 0.16$
* **Result:** $P_v = \mathbf{0.16}$ (a low vegetation-cover proxy under these declared NDVI endpoints).

#### 🧪 Example 2: Urban Park ($\text{NDVI} = 0.68$)
1. Numerator: $0.68 - 0.20 = 0.48$
2. Denominator: $0.80 - 0.20 = 0.60$
3. Unsquared fraction: $0.48 / 0.60 = 0.80$
4. Square it: $(0.80)^2 = 0.64$
* **Result:** $P_v = \mathbf{0.64}$ (a higher vegetation-cover proxy under these declared NDVI endpoints).

#### 🧪 Example 3: Value Above the Chosen Endpoint
* **Given:** $\text{NDVI}=0.90$, $\text{NDVI}_{\min}=0.20$, and $\text{NDVI}_{\max}=0.80$.
1. Raw fraction: $(0.90-0.20)/(0.80-0.20)=1.167$.
2. Clip to $1$, then square: $1^2=1$.
* **Result:** $P_v=\mathbf{1.00}$, a bounded proxy—not proof of 100% canopy.

---

### 1.5 Land Surface Emissivity ($\varepsilon$)

#### 💡 What is this in plain English?
Real-world materials emit thermal radiation less efficiently than a perfect theoretical blackbody. **Land Surface Emissivity ($\varepsilon$)** is a scale factor from $0.0$ to $1.0$ that tells us how efficiently a surface radiates heat. Plants are very efficient ($\approx 0.985$), whereas concrete and bare soils are less efficient ($\approx 0.960 - 0.970$).

#### 📐 The Math Formula
$$\varepsilon = 0.004 \cdot P_v + 0.986$$

#### 🧪 Example 1: Suburban Pixel ($P_v = 0.16$)
1. Multiply: $0.004 \times 0.16 = 0.00064$
2. Add baseline: $0.00064 + 0.986 = 0.98664$
* **Result:** $\varepsilon = \mathbf{0.98664}$.

#### 🧪 Example 2: Park Pixel ($P_v = 0.64$)
1. Multiply: $0.004 \times 0.64 = 0.00256$
2. Add baseline: $0.00256 + 0.986 = 0.98856$
* **Result:** $\varepsilon = \mathbf{0.98856}$.

#### 🧪 Example 3: Fully Vegetated-Proxy Endpoint
* **Given:** $P_v=1.00$.
1. $\varepsilon = 0.004(1.00)+0.986=0.990$.
* **Result:** $\varepsilon=\mathbf{0.990}$ for this declared empirical model; a different material model may use different coefficients.

---

### 1.6 Single-Channel Emissivity-Corrected LST

#### 💡 What is this in plain English?
This is one single-channel **land-surface-temperature estimate**. It adjusts brightness temperature with a declared emissivity model; it does not directly measure a surface's “true” temperature and is sensitive to sensor, atmosphere, emissivity, QA masking, and calibration choices.

#### 📐 The Math Formula
$$\text{LST} = \frac{T_b}{1 + \left( \frac{\lambda \cdot T_b}{\rho} \right) \cdot \ln(\varepsilon)} - 273.15$$

* $T_b$: Brightness Temperature in Kelvin ($K$).
* $\lambda$: Emitted radiance wavelength ($\approx 11.5\,\mu\text{m}$).
* $\rho = \frac{h \cdot c}{\sigma} \approx 14,388\,\mu\text{m}\cdot\text{K}$.

#### 🧪 Example 1: Concrete Parking Lot ($T_b = 309.21\text{ K}$, $\varepsilon = 0.965$)
1. Natural log of emissivity: $\ln(0.965) = -0.03563$
2. Wavelength term: $(11.5 \times 309.21) / 14,388 = 0.24714$
3. Product: $0.24714 \times (-0.03563) = -0.008806$
4. Denominator: $1 + (-0.008806) = 0.991194$
5. Corrected Kelvin: $309.21 / 0.991194 = 311.96\text{ K}$
6. Convert to Celsius: $311.96 - 273.15 = 38.81\text{°C}$
* **Result:** Single-channel LST estimate = $\mathbf{38.81\text{°C}}$ under the stated wavelength and emissivity assumptions.

#### 🧪 Example 2: Dense Lawn ($T_b = 283.88\text{ K}$, $\varepsilon = 0.990$)
1. Natural log of emissivity: $\ln(0.990) = -0.01005$
2. Wavelength term: $(11.5 \times 283.88) / 14,388 = 0.22690$
3. Product: $0.22690 \times (-0.01005) = -0.002280$
4. Denominator: $1 + (-0.002280) = 0.997720$
5. Corrected Kelvin: $283.88 / 0.997720 = 284.53\text{ K}$
6. Convert to Celsius: $284.53 - 273.15 = 11.38\text{°C}$
* **Result:** Single-channel LST estimate = $\mathbf{11.38\text{°C}}$ under the stated assumptions.

#### 🧪 Example 3: Moderate Surface Estimate
* **Given:** $T_b=300\text{ K}$, $\varepsilon=0.990$, $\lambda=10.9\,\mu\text{m}$, and $\rho=14,388\,\mu\text{m}\cdot\text{K}$.
1. The emissivity correction gives approximately $300.69\text{ K}$.
2. Convert: $300.69-273.15\approx27.54\text{°C}$.
* **Result:** a $\mathbf{27.5\text{°C}}$ single-channel estimate under the stated assumptions, not a field-validated truth value.

---

### 1.7 Split-Window Algorithm (SWA) LST

#### 💡 What is this in plain English?
A split-window product uses two compatible thermal observations. Atmospheric water vapor affects those channels differently, so a **sensor-specific** split-window algorithm can estimate LST from their contrast. It does not universally “cancel” atmospheric effects, and its coefficients must be validated for the sensor and input product. This app does not apply a generic split-window calculation to its bundled prepared arrays.

#### 📐 The Math Formula
$$\text{LST} = T_{b10} + c_1(T_{b10} - T_{b11}) + c_2(T_{b10} - T_{b11})^2 + c_0 + (a_1 + a_2 \cdot W)(1 - \varepsilon_m) + (b_1 + b_2 \cdot W) \cdot \Delta\varepsilon$$

* $T_{b10}, T_{b11}$: Brightness temperatures of Band 10 and Band 11 ($\text{°C}$).
* $\varepsilon_m = \frac{\varepsilon_{10} + \varepsilon_{11}}{2}$ (Mean emissivity).
* $\Delta\varepsilon = \varepsilon_{10} - \varepsilon_{11}$ (Emissivity difference).
* $W$: Total atmospheric water vapor column.
* $c_0, c_1, c_2, a_1, a_2, b_1, b_2$: Empirical calibration constants.

#### 🧪 Example 1: Humid Summer Day Over Downtown
* **Given:** $T_{b10} = 35.0\text{°C}$, $T_{b11} = 33.2\text{°C}$, mean emissivity $\varepsilon_m = 0.970$, $\Delta\varepsilon = 0.004$, $W = 2.0\text{ g/cm}^2$.
* Constants: $c_1 = 1.35$, $c_2 = 0.18$, $c_0 = 0.25$, $(a_1 + a_2 W) = 22.0$, $(b_1 + b_2 W) = 110.0$.
1. Temperature difference: $T_{b10} - T_{b11} = 35.0 - 33.2 = 1.8\text{°C}$
2. First-order difference term: $1.35 \times 1.8 = 2.43$
3. Second-order difference term: $0.18 \times (1.8)^2 = 0.5832$
4. Emissivity mean deficit term: $22.0 \times (1 - 0.970) = 22.0 \times 0.030 = 0.66$
5. Emissivity delta term: $110.0 \times 0.004 = 0.44$
6. Sum all terms: $35.0 + 2.43 + 0.5832 + 0.25 + 0.66 + 0.44 = 39.3632\text{°C}$
* **Result:** Split-Window LST = $\mathbf{39.36\text{°C}}$.

#### 🧪 Example 2: Dry Air Over City Park
* **Given:** $T_{b10} = 22.0\text{°C}$, $T_{b11} = 21.1\text{°C}$, $\varepsilon_m = 0.988$, $\Delta\varepsilon = 0.001$, $W = 0.8\text{ g/cm}^2$.
* Constants: $c_1 = 1.35$, $c_2 = 0.18$, $c_0 = 0.25$, $(a_1 + a_2 W) = 12.0$, $(b_1 + b_2 W) = 60.0$.
1. Temperature difference: $22.0 - 21.1 = 0.9\text{°C}$
2. First-order term: $1.35 \times 0.9 = 1.215$
3. Second-order term: $0.18 \times (0.9)^2 = 0.1458$
4. Emissivity mean deficit term: $12.0 \times (1 - 0.988) = 12.0 \times 0.012 = 0.144$
5. Emissivity delta term: $60.0 \times 0.001 = 0.06$
6. Sum all terms: $22.0 + 1.215 + 0.1458 + 0.25 + 0.144 + 0.06 = 23.8148\text{°C}$
* **Result:** Split-Window LST = $\mathbf{23.81\text{°C}}$.

#### 🧪 Example 3: Coefficient Sensitivity
* **Given:** the same channel temperatures but a different sensor-specific coefficient set.
1. Replacing coefficients changes the correction terms even when $T_{b10}$ and $T_{b11}$ do not change.
* **Result:** there is no sensor-independent split-window answer. The app requires every coefficient and water-vapour input to be declared before calculation.

---

# 2. Graph Theory & Network Math

> 🟦 **◆ INNOVATION — Product-active graph translation.** The app turns valid
> prepared raster cells into a transparent weighted graph, retaining the
> declared conductance rule instead of hiding it behind a hotspot score. This
> is an integration innovation, not a claim to have invented graph theory.

This guide uses city blocks/neighborhoods as a teaching analogy. In the active
app, a valid **raster cell** is a node and a 4- or 8-neighbour raster adjacency
is an edge; it is not a street, pedestrian, social, or legal-access network.

```
  (Node 1: Downtown) ------ [Weight = 5.0] ------ (Node 2: Industrial)
          |                                               |
   [Weight = 2.0]                                  [Weight = 1.0]
          |                                               |
  (Node 3: Suburb A)  ------ [Weight = 4.0] ------ (Node 4: City Park)
```

---

### 2.1 Adjacency Matrix ($A$)

#### 💡 What is this in plain English?
An **Adjacency Matrix ($A$)** is a square grid lookup table that records the declared connection strength between every pair of nodes. If the chosen graph connects two nodes, the entry is its weight; otherwise it is $0$. In this app, weight is a thermal/vegetation-derived conductance proxy, not road capacity.

#### 📐 The Math Formula
$$A_{ij} = \begin{cases} w_{ij} & \text{if node } i \text{ and } j \text{ are connected} \\ 0 & \text{otherwise} \end{cases}$$

#### 🧪 Example 1: 3-Neighborhood City Network
* **Nodes:** $N_1$ (Downtown), $N_2$ (Industrial), $N_3$ (Residential Suburb).
* Connections:
  * $N_1 \leftrightarrow N_2$: Heavy 4-lane thermal highway corridor ($w_{12} = 8$).
  * $N_1 \leftrightarrow N_3$: Residential arterial road ($w_{13} = 3$).
  * $N_2 \leftrightarrow N_3$: Separated by a river; no direct thermal connection ($w_{23} = 0$).

$$\mathbf{A} = \begin{bmatrix} 0 & 8 & 3 \\ 8 & 0 & 0 \\ 3 & 0 & 0 \end{bmatrix}$$

#### 🧪 Example 2: Adding a 4th Neighborhood (City Park)
* Node $N_4$ (Park) connects to $N_2$ (Industrial) with weight $1$ and $N_3$ (Residential Suburb) with weight $5$.

$$\mathbf{A} = \begin{bmatrix} 0 & 8 & 3 & 0 \\ 8 & 0 & 0 & 1 \\ 3 & 0 & 0 & 5 \\ 0 & 1 & 5 & 0 \end{bmatrix}$$

#### 🧪 Example 3: Two Valid Raster Neighbours
* **Given:** adjacent cells $i$ and $j$ have a declared graph weight $w_{ij}=0.70$.
1. Set $A_{ij}=A_{ji}=0.70$; all non-neighbours remain $0$.
* **Result:** adjacency records a symmetric, unitless modeled connection—not a road, sidewalk, or physical heat-flow link.

---

### 2.2 Degree Matrix ($D$)

#### 💡 What is this in plain English?
The **Degree Matrix ($D$)** is a diagonal matrix that sums up the total connection strength attached to each individual node. It represents how strongly connected a neighborhood is to its surrounding environment.

#### 📐 The Math Formula
$$D_{ii} = \sum_{j=1}^{n} A_{ij}, \quad D_{ij} = 0 \text{ for } i \neq j$$

#### 🧪 Example 1: Degree Matrix for the 3-Neighborhood City
Using Adjacency Matrix $A$ from Example 2.1:
* Row 1 ($N_1$): $0 + 8 + 3 = 11$
* Row 2 ($N_2$): $8 + 0 + 0 = 8$
* Row 3 ($N_3$): $3 + 0 + 0 = 3$

$$\mathbf{D} = \begin{bmatrix} 11 & 0 & 0 \\ 0 & 8 & 0 \\ 0 & 0 & 3 \end{bmatrix}$$

#### 🧪 Example 2: Degree Matrix for the 4-Neighborhood City
Using Adjacency Matrix $A$ from Example 2.2:
* Row 1 ($N_1$): $0 + 8 + 3 + 0 = 11$
* Row 2 ($N_2$): $8 + 0 + 0 + 1 = 9$
* Row 3 ($N_3$): $3 + 0 + 0 + 5 = 8$
* Row 4 ($N_4$): $0 + 1 + 5 + 0 = 6$

$$\mathbf{D} = \begin{bmatrix} 11 & 0 & 0 & 0 \\ 0 & 9 & 0 & 0 \\ 0 & 0 & 8 & 0 \\ 0 & 0 & 0 & 6 \end{bmatrix}$$

#### 🧪 Example 3: Weighted Raster-Cell Degree
* **Given:** one cell connects to three neighbours with weights $0.4$, $0.5$, and $0.7$.
1. Sum: $D_{ii}=0.4+0.5+0.7=1.6$.
* **Result:** degree $\mathbf{1.6}$ measures graph support under the declared conductance proxy, not three physical facilities.

---

### 2.3 Unnormalized Graph Laplacian ($L = D - A$)

#### 💡 What is this in plain English?
The **Graph Laplacian ($L$)** is a discrete difference operator built from a declared graph. It can model diffusion only when the graph weights and governing physical model justify that interpretation. Here it is used for graph structure: subtracting adjacency from degree records how a node differs from its declared neighbours. The app does not claim physical heat-flow or traffic simulation.

#### 📐 The Math Formula
$$\mathbf{L} = \mathbf{D} - \mathbf{A}$$

#### 🧪 Example 1: Unnormalized Laplacian for the 3-Neighborhood City
1. $\mathbf{D} = \begin{bmatrix} 11 & 0 & 0 \\ 0 & 8 & 0 \\ 0 & 0 & 3 \end{bmatrix}$
2. $\mathbf{A} = \begin{bmatrix} 0 & 8 & 3 \\ 8 & 0 & 0 \\ 3 & 0 & 0 \end{bmatrix}$
3. Subtract $\mathbf{D} - \mathbf{A}$:

$$\mathbf{L} = \begin{bmatrix} 11 - 0 & 0 - 8 & 0 - 3 \\ 0 - 8 & 8 - 0 & 0 - 0 \\ 0 - 0 & 0 - 0 & 3 - 0 \end{bmatrix} = \begin{bmatrix} 11 & -8 & -3 \\ -8 & 8 & 0 \\ -3 & 0 & 3 \end{bmatrix}$$

*(Notice how every row sum equals 0!)*

#### 🧪 Example 2: Unnormalized Laplacian for the 4-Neighborhood City
1. $\mathbf{D} = \begin{bmatrix} 11 & 0 & 0 & 0 \\ 0 & 9 & 0 & 0 \\ 0 & 0 & 8 & 0 \\ 0 & 0 & 0 & 6 \end{bmatrix}$
2. $\mathbf{A} = \begin{bmatrix} 0 & 8 & 3 & 0 \\ 8 & 0 & 0 & 1 \\ 3 & 0 & 0 & 5 \\ 0 & 1 & 5 & 0 \end{bmatrix}$
3. Subtract $\mathbf{D} - \mathbf{A}$:

$$\mathbf{L} = \begin{bmatrix} 11 & -8 & -3 & 0 \\ -8 & 9 & 0 & -1 \\ -3 & 0 & 8 & -5 \\ 0 & -1 & -5 & 6 \end{bmatrix}$$

#### 🧪 Example 3: One Laplacian Row
* **Given:** degree $1.6$ and neighbour weights $0.4$, $0.5$, and $0.7$.
1. The row is $[1.6,-0.4,-0.5,-0.7]$.
2. Check: $1.6-0.4-0.5-0.7=0$.
* **Result:** the zero row sum is a structural property of the Laplacian; it does not prove diffusion in the city.

---

### 2.4 Symmetric Normalized Graph Laplacian ($L_{\text{sym}}$)

#### 💡 What is this in plain English?
In real cities, a huge downtown central node with dozens of connections can dominate simple Laplacian calculations compared to a small quiet suburban node. The **Symmetric Normalized Graph Laplacian ($L_{\text{sym}}$)** scales every connection by the relative size of the nodes it links, making it fair across big and small neighborhoods.

#### 📐 The Math Formula
$$\mathbf{L}_{\text{sym}} = \mathbf{D}^{-1/2} \mathbf{L} \mathbf{D}^{-1/2} = \mathbf{I} - \mathbf{D}^{-1/2} \mathbf{A} \mathbf{D}^{-1/2}$$

#### 🧪 Example 1: Two Connected Neighborhoods of Unequal Size
* $N_1$ and $N_2$ each have total weighted degree $4$ and one connection $w_{12}=4$.
1. Compute degree square root inverse:
   * $D_{11}^{-1/2} = 1/\sqrt{4} = 0.50$
   * $D_{22}^{-1/2} = 1/\sqrt{4} = 0.50$
2. Compute off-diagonal element for $L_{\text{sym}(1,2)}$:
   * $L_{\text{sym}(1,2)} = - D_{11}^{-1/2} \cdot A_{12} \cdot D_{22}^{-1/2} = -(0.50) \times 4 \times (0.50) = -1.0$
3. On diagonal elements are always $1.0$:

$$\mathbf{L}_{\text{sym}} = \begin{bmatrix} 1.0 & -1.0 \\ -1.0 & 1.0 \end{bmatrix}$$

#### 🧪 Example 3: Why Normalize?
* **Given:** an edge $i\leftrightarrow j$ has weight $4$, but degrees are $16$ and $4$ because each node has other neighbours.
1. Normalized off-diagonal: $-4/\sqrt{16\times4}=-0.5$.
* **Result:** normalization compares the link with the support at both ends, rather than letting the high-degree node dominate by size alone.

#### 🧪 Example 2: Two Connected Equal-Sized Neighborhoods
* $N_1$ (Degree $D_{11} = 9$), $N_2$ (Degree $D_{22} = 9$). Connection weight $w_{12} = 9$.
1. $D_{11}^{-1/2} = 1/\sqrt{9} = 0.3333$
2. $D_{22}^{-1/2} = 1/\sqrt{9} = 0.3333$
3. Off-diagonal element: $-(0.3333) \times 9 \times (0.3333) = -1.0$

$$\mathbf{L}_{\text{sym}} = \begin{bmatrix} 1.0 & -1.0 \\ -1.0 & 1.0 \end{bmatrix}$$

---

# 3. Spectral Graph Theory & Clustering

> 🟦 **◆ INNOVATION — Product-active spectral explanation.** The normalized
> Laplacian, Fiedler ordering, sweep conductance, and modeled sink linkage are
> used together to turn a thermal field into a question about weak **modeled**
> connectivity. The result is a candidate for local investigation, never proof
> of heat flow, accessibility, or intervention benefit.

---

### 3.1 Fiedler Vector & Fiedler Value ($\lambda_2$)

#### 💡 What is this in plain English?
When you perform eigenvalue decomposition on a Graph Laplacian matrix ($L$), the smallest eigenvalue ($\lambda_1$) is always $0$. The **second smallest eigenvalue ($\lambda_2$)** is called the **Fiedler Value** or *algebraic connectivity*.

* If $\lambda_2 = 0$, the declared graph is disconnected (or has more than one component); it does not establish anything about roads or real-world access.
* The eigenvector corresponding to $\lambda_2$ is the **Fiedler Vector**. Its ordered values support a sweep over candidate partitions. Its sign is arbitrary, so positive versus negative is not itself a stable interpretation.

#### 📐 The Math Formula
$$\mathbf{L} \mathbf{v}_2 = \lambda_2 \mathbf{v}_2$$

#### 🧪 Example 1: Slicing a 4-Node Linear City Graph
This is an **unnormalized-Laplacian teaching example** (the app uses the
normalized Laplacian described in Section 2.4). Suppose a line of 4
neighborhoods has second smallest eigenvalue $\lambda_2 = 0.586$. Its Fiedler
vector is:
$$\mathbf{v}_2 = [-0.63, -0.32, +0.32, +0.63]^T$$
1. Look at sign of entries:
   * $N_1 (-0.63)$ and $N_2 (-0.32)$ are **Negative**.
   * $N_3 (+0.32)$ and $N_4 (+0.63)$ are **Positive**.
* **Result:** Slicing the city between $N_2$ and $N_3$ creates the most natural, balanced network cut.

#### 🧪 Example 2: Highly Connected Mesh City
In a highly connected normalized-graph example, $\lambda_2 = 1.45$. Because it is relatively large (normalized-Laplacian eigenvalues lie in $[0,2]$), the declared graph is harder to separate by a low-conductance cut. This does not establish real-world resistance to thermal barriers.

#### 🧪 Example 3: Disconnected-Graph Safety Check
* **Given:** a graph has two components and no edge between them.
1. Its second normalized-Laplacian eigenvalue is $\lambda_2=0$.
* **Result:** the app must not describe a unique Fiedler bottleneck. Disconnection is a data/graph condition to report, not a cooling finding.

---

### 3.2 Cheeger Constant ($\text{h}(G)$ / Isoperimetric Constant)

#### 💡 What is this in plain English?
The **Cheeger Constant ($\text{h}(G)$)** measures bottleneck strength in a declared graph. It asks: *"What is the smallest ratio of boundary edge weight to the size of the smaller side?"* A low value means the graph has a weakly connected partition. It does not prove that heat, traffic, or people are physically trapped.

#### 📐 The Math Formula
$$\text{h}(G) = \min_{S \subset V} \frac{|\partial S|}{\min(\text{vol}(S), \text{vol}(V \setminus S))}$$

* $|\partial S|$: Sum of edge weights crossing the cut boundary.
* $\text{vol}(S)$: Sum of degrees of nodes in set $S$.

#### 🧪 Example 1: Two Clusters Connected by One Narrow Bridge
* Cluster $A$ has internal volume $\text{vol}(A) = 50$.
* Cluster $B$ has internal volume $\text{vol}(B) = 50$.
* The two clusters are connected by 1 bridge with weight $|\partial S| = 2$.
1. Ratio = $\frac{2}{\min(50, 50)} = \frac{2}{50} = 0.04$
* **Result:** $\text{h}(G) = \mathbf{0.04}$ (Extremely strong bottleneck).

#### 🧪 Example 2: Dense Urban Ring Road
* District $S$ has volume $\text{vol}(S) = 40$. Remaining city has volume $80$.
* District $S$ is connected to the city by 5 multi-lane roads with total weight $|\partial S| = 20$.
1. Ratio = $\frac{20}{\min(40, 80)} = \frac{20}{40} = 0.50$
* **Result:** $\text{h}(G) = \mathbf{0.50}$ (High connectivity, weak bottleneck).

#### 🧪 Example 3: Conductance of a Candidate Region
* **Given:** candidate set $S$ has cut weight $2$, $\text{vol}(S)=50$, and $\text{vol}(V\setminus S)=70$.
1. $\phi(S)=2/\min(50,70)=2/50=0.04$.
* **Result:** $\mathbf{0.04}$ is weak connectivity in this declared graph; it is a question for local inspection, not proof that heat is trapped.

---

### 3.3 Cheeger Cut & Cheeger Inequality

#### 💡 What is this in plain English?
Finding the exact Cheeger Cut for a large graph is computationally hard. **Cheeger's Inequality** relates the normalized-Laplacian Fiedler value ($\lambda_2$) to graph conductance; it bounds a graph property but does not certify that a particular Fiedler sweep is the globally optimal cut.

#### 📐 The Math Formula
$$\frac{\lambda_2}{2} \le \text{h}(G) \le \sqrt{2 \lambda_2}$$

#### 🧪 Example 1: Tight Bottleneck Network ($\lambda_2 = 0.08$)
1. Lower Bound: $0.08 / 2 = 0.04$
2. Upper Bound: $\sqrt{2 \times 0.08} = \sqrt{0.16} = 0.40$
* **Result:** The true network bottleneck constant $\text{h}(G)$ is mathematically bounded between $\mathbf{0.04}$ and $\mathbf{0.40}$.

#### 🧪 Example 2: Well-Mixed Grid Network ($\lambda_2 = 1.28$)
1. Lower Bound: $1.28 / 2 = 0.64$
2. Upper Bound: $\sqrt{2 \times 1.28} = \sqrt{2.56} = 1.60$
* **Result:** The bottleneck metric $\text{h}(G)$ is guaranteed to sit between $\mathbf{0.64}$ and $\mathbf{1.60}$.

#### 🧪 Example 3: Compare a Sweep with the Exact Small-Graph Cut
* **Given:** a 10-node diagnostic graph has Fiedler-sweep conductance $0.18$ and exact enumerated optimum $0.15$.
1. Approximation gap: $0.18-0.15=0.03$.
* **Result:** the sweep is a useful candidate with a known small-graph gap; the production app does not exhaustively enumerate city graphs.

---

### 3.4 Spectral Clustering Algorithm

#### 💡 What is this in plain English?
Instead of clustering neighborhoods based purely on geographic coordinates ($x, y$), **Spectral Clustering** projects complex non-linear spatial graph shapes into a low-dimensional "eigenvector space" using the Graph Laplacian matrix, where standard algorithms like $k$-Means can easily group distinct thermal micro-climates.

#### 📐 Step-by-Step Mathematical Workflow
1. Build Adjacency Matrix $A$ and Symmetric Laplacian $L_{\text{sym}}$.
2. Compute the $k$ smallest eigenvectors $\mathbf{v}_1, \mathbf{v}_2, \dots, \mathbf{v}_k$.
3. Form matrix $U \in \mathbb{R}^{n \times k}$ with these eigenvectors as columns.
4. Normalize rows of $U$ to unit length.
5. Cluster row vectors into $k$ groups using standard $k$-Means clustering.

#### 🧪 Example 1: Grouping 3 Neighborhoods Into 2 Thermal Zones
* Neighborhoods $N_1, N_2, N_3$ yield 2-dimensional eigenvector coordinate rows:
  * $N_1$: $(-0.707, 0.120)$
  * $N_2$: $(-0.690, 0.140)$
  * $N_3$: $(0.710, -0.050)$
1. Measure Euclidean distance between $N_1$ and $N_2$: $\sqrt{(-0.707 - -0.690)^2 + (0.120 - 0.140)^2} = \sqrt{0.000289 + 0.0004} = 0.026$ (Close!).
2. Measure distance between $N_1$ and $N_3$: $\sqrt{(-0.707 - 0.710)^2 + (0.120 - -0.050)^2} = \sqrt{2.0078 + 0.0289} = 1.427$ (Far!).
* **Result:** Cluster Group 1 = $\{N_1, N_2\}$ (Cool residential zone), Cluster Group 2 = $\{N_3\}$ (Hot industrial zone).

#### 🧪 Example 2: Delineating an Urban Cool Island
* Matrix rows for a central park ($N_{\text{park}}$) vs surrounding asphalt blocks ($N_{\text{asp1}}, N_{\text{asp2}}$):
  * $N_{\text{park}} = (0.01, 0.99)$
  * $N_{\text{asp1}} = (0.85, 0.02)$
  * $N_{\text{asp2}} = (0.88, 0.01)$
* **Result:** Spectral clustering isolates the park into its own distinct thermal cluster.

#### 🧪 Example 3: Chosen Cluster Count
* **Given:** a declared graph is clustered with $k=3$.
1. The algorithm returns one label from $\{1,2,3\}$ for each node.
* **Result:** the labels are categories created under the chosen $k$ and graph rule; they are not automatically neighbourhood types or policy districts.

---

### 3.5 Modularity ($Q$) & Graph Partitioning

#### 💡 What is this in plain English?
**Modularity ($Q$)** evaluates the quality of a city partition. It compares the number of connections *inside* detected thermal zones against what would be expected purely by random chance.
* Higher positive $Q$ can indicate more within-partition weight than the stated null model expects.
* There is no universal “strong” cutoff: graph size, density, resolution, and the null model matter.

#### 📐 The Math Formula
$$Q = \frac{1}{2m} \sum_{i,j} \left( A_{ij} - \frac{k_i k_j}{2m} \right) \delta(c_i, c_j)$$

* $m$: Total weight of all edges in graph.
* $k_i, k_j$: Degrees of nodes $i$ and $j$.
* $\delta(c_i, c_j) = 1$ if $i$ and $j$ belong to the same cluster, else $0$.

#### 🧪 Example 1: Well-Separated Industrial vs Park Districts
* Total graph edge weight $m = 20$.
* Inside proposed Cluster 1 ($N_1, N_2$): $A_{12} = 8$, degrees $k_1 = 10, k_2 = 10$.
1. Expected weight by chance: $\frac{10 \times 10}{2 \times 20} = \frac{100}{40} = 2.5$
2. Actual minus expected: $8 - 2.5 = 5.5$
3. Normalize by $2m = 40$: $5.5 / 40 = 0.1375$ (From a single internal pair).
* **Result:** Summing across all pairs yields $Q = \mathbf{0.48}$ (High modularity cut!).

#### 🧪 Example 2: Arbitrary Grid Partition
* Actual internal edge weight $= 3$. Expected by chance $= 2.8$.
1. Actual minus expected: $3 - 2.8 = 0.2$
2. Normalized: $0.2 / 40 = 0.005$
* **Result:** Summing across all pairs yields $Q = \mathbf{0.02}$ (Poor partition).

#### 🧪 Example 3: Compare Two Declared Partitions
* **Given:** partition A has $Q=0.31$ and partition B has $Q=0.18$ under the same graph and null model.
1. Difference: $0.31-0.18=0.13$.
* **Result:** A has higher modularity **for that comparison**; it does not prove that A is the socially, physically, or administratively correct boundary.

---

# 4. Probability, Statistics & Spatial Risk Modeling

> 🟦 **◆ INNOVATION — Gated spatial-pattern preview.** The app's reusable
> layer contract makes a seeded, FDR-adjusted Local Moran/LISA preview visible
> on the Boston atlas while keeping it hidden by default and labelled
> computationally verified. It is not a public hotspot or health-risk layer.

---

### 4.1 Global Moran's I (Spatial Autocorrelation)

#### 💡 What is this in plain English?
**Global Moran's I** measures spatial autocorrelation across an entire city: *Are hot neighborhoods grouped together next to other hot neighborhoods, or is heat randomly scattered like a chessboard?*
* Positive values indicate positive autocorrelation under the declared weights.
* Values near the null expectation indicate little evidence of that association.
* Negative values indicate negative autocorrelation (a more alternating pattern).

The attainable range and null expectation depend on the spatial-weight matrix;
do not treat $-1$, $0$, and $+1$ as universal calibrated thresholds.

#### 📐 The Math Formula
$$I = \frac{N}{S_0} \frac{\sum_{i=1}^N \sum_{j=1}^N w_{ij} (x_i - \bar{x})(x_j - \bar{x})}{\sum_{i=1}^N (x_i - \bar{x})^2}$$

* $N$: Total number of spatial units.
* $x_i$: LST of neighborhood $i$.
* $\bar{x}$: Mean LST across city.
* $w_{ij}$: Spatial weight between $i$ and $j$.
* $S_0 = \sum_{i} \sum_{j} w_{ij}$.

#### 🧪 Example 1: Clustered Urban Heat
* $N = 3$, City Mean $\bar{x} = 30\text{°C}$, $S_0 = 2$.
* Temperatures: $x_1 = 36\text{°C}$, $x_2 = 34\text{°C}$, $x_3 = 20\text{°C}$.
* Weight matrix: $w_{12} = 1, w_{21} = 1$, others $0$.
1. Anomaly products:
   * Neighbor pair $(1,2)$: $(36-30)(34-30) \times 1 = (+6)(+4) = 24$
   * Neighbor pair $(2,1)$: $(34-30)(36-30) \times 1 = (+4)(+6) = 24$
   * Total Numerator Sum = $48$
2. Denominator sum of squared deviations: $(36-30)^2 + (34-30)^2 + (20-30)^2 = 36 + 16 + 100 = 152$
3. Compute $I$: $\left(\frac{3}{2}\right) \times \left(\frac{48}{152}\right) = 1.5 \times 0.3158 = 0.4737$
* **Result:** Moran's $I = \mathbf{+0.474}$ (positive autocorrelation in this toy weight graph; assess significance separately).

#### 🧪 Example 2: Uniform Mixed Spatial Temperatures
* Temperatures: $x_1 = 36\text{°C}$, $x_2 = 20\text{°C}$, $x_3 = 34\text{°C}$.
* Anomaly products for neighbor pair $(1,2)$: $(36-30)(20-30) = (+6)(-10) = -60$.
* **Result:** Moran's $I = \mathbf{-0.592}$ (negative autocorrelation in this toy weight graph; assess significance separately).

#### 🧪 Example 3: Permutation Context
* **Given:** observed Moran's $I=0.32$ and $499$ value permutations, with $8$ simulated statistics at least as extreme.
1. Permutation p-value: $(8+1)/(499+1)=0.018$.
* **Result:** the pattern is statistically unusual under that permutation null; it still is not a causal explanation or a heat-risk finding.

---

### 4.2 Local Moran's I (LISA / Spot Detection)

#### 💡 What is this in plain English?
While Global Moran's I gives one score for a field, **Local Moran's I ($I_i$)** evaluates local spatial association. A High-High, Low-Low, High-Low, or Low-High label requires a declared neighbour rule and a significance procedure; it is a spatial-pattern label, not a causal “hotspot” finding.

#### 📐 The Math Formula
$$I_i = \frac{x_i - \bar{x}}{s^2} \sum_{j=1}^N w_{ij} (x_j - \bar{x})$$

* $s^2$: A declared variance standardization (often the population variance of
  the centered field); conventions differ across implementations.

The equation above is a common standardized presentation. The current
`moran_lisa` primitive stores the unstandardized centered-value product and
uses seeded permutations plus Benjamini–Hochberg adjustment for the preview;
do not compare raw local-score magnitudes across implementations without
checking their standardization and neighbour rule.

#### 🧪 Example 1: Industrial Warehouse ($x_i = 38\text{°C}$, $\bar{x} = 30\text{°C}$, $s^2 = 16$)
* Neighboring blocks average temperature anomaly $\sum w_{ij}(x_j - \bar{x}) = +6\text{°C}$.
1. Standardized target node: $(38 - 30) / 16 = 8 / 16 = 0.50$
2. Multiply by neighbor anomaly: $0.50 \times (+6) = +3.0$
* **Result:** $I_i = \mathbf{+3.0}$ (a positive local-association statistic; a High-High label additionally needs the declared significance test and neighbour mean).

#### 🧪 Example 2: Cool Park in Industrial Zone ($x_i = 22\text{°C}$, $\bar{x} = 30\text{°C}$, $s^2 = 16$)
* Surrounded by hot industrial neighbors with anomaly $+6\text{°C}$.
1. Standardized target node: $(22 - 30) / 16 = -8 / 16 = -0.50$
2. Multiply by neighbor anomaly: $-0.50 \times (+6) = -3.0$
* **Result:** $I_i = \mathbf{-3.0}$ (a negative local-association statistic consistent with a Low-High pattern only after the declared significance test).

#### 🧪 Example 3: Multiple-Testing Gate
* **Given:** a cell's raw local p-value is $0.01$ but its Benjamini–Hochberg adjusted p-value is $0.08$, with $\alpha=0.05$.
1. Compare $0.08>0.05$.
* **Result:** label the cell **not significant**. The app's preview uses this adjustment so many map cells are not casually promoted to patterns.

---

### 4.3 Probability Density Functions (PDFs) for Heat Waves

#### 💡 What is this in plain English?
A **Probability Density Function (PDF)** models the distribution of a documented sample. A density value at one temperature is not a probability; probability over a range is the integral of the density over that range. A valid heat-event claim also needs a representative time series and a defined threshold.

#### 📐 The Math Formula (Gaussian PDF)
$$f(x) = \frac{1}{\sigma \sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x - \mu}{\sigma}\right)^2}$$

* $\mu$: Mean summer temperature.
* $\sigma$: Standard deviation.

#### 🧪 Example 1: Normal Summer Day ($x = 35\text{°C}$, $\mu = 30\text{°C}$, $\sigma = 2.5\text{°C}$)
1. $z$-score: $(35 - 30) / 2.5 = 2.0$
2. Exponent: $-\frac{1}{2}(2.0)^2 = -2.0$
3. Exponential value: $e^{-2.0} = 0.1353$
4. Constant scaling: $\frac{1}{2.5 \sqrt{2\pi}} = \frac{1}{2.5 \times 2.5066} = \frac{1}{6.2665} = 0.1596$
5. Product: $0.1596 \times 0.1353 = 0.0216$
* **Result:** PDF Density value $f(35) = \mathbf{0.0216}$.

#### 🧪 Example 2: Average Summer Day ($x = 30\text{°C}$, $\mu = 30\text{°C}$, $\sigma = 2.5\text{°C}$)
1. $z$-score: $(30 - 30) / 2.5 = 0$
2. Exponent: $e^0 = 1.0$
3. Product: $0.1596 \times 1.0 = 0.1596$
* **Result:** PDF Density value $f(30) = \mathbf{0.1596}$ (Peak probability density).

#### 🧪 Example 3: Density Is Not a Percent
* **Given:** $f(35)=0.0216\text{ per °C}$.
1. This is a curve height, not a $2.16\%$ probability.
2. Probability for a range, such as $35$ to $36\text{°C}$, requires integrating the density across that interval.
* **Result:** report density with its inverse-temperature unit and keep probability claims tied to a documented sample and interval.

---

### 4.4 Joint & Conditional Probabilities of Area-Level Conditions

#### 💡 What is this in plain English?
* **Joint Probability $P(A \cap B)$:** The share of eligible spatial units where two declared conditions co-occur.
* **Conditional Probability $P(A \mid B)$:** The share of units with condition $B$ that also meet condition $A$.

These descriptive proportions do not establish causation, personal vulnerability, or a public health risk score. The app does not publish population-vulnerability maps without governance approval.

#### 📐 The Math Formulas
$$P(A \cap B) = P(A \mid B) \cdot P(B)$$
$$P(A \mid B) = \frac{P(A \cap B)}{P(B)}$$

#### 🧪 Example 1: Calculating Joint Vulnerability Risk
* Probability a district has high elderly pop $P(\text{Elderly}) = 0.20$.
* Probability a district is hot given high elderly pop $P(\text{Hot} \mid \text{Elderly}) = 0.45$.
1. Joint Risk: $P(\text{Hot} \cap \text{Elderly}) = 0.45 \times 0.20 = 0.09$
* **Result:** $9\%$ of the eligible districts in this toy sample meet both declared conditions.

#### 🧪 Example 2: Conditional Heat Risk Given Low Tree Canopy
* Out of 100 city blocks, 30 blocks have low tree canopy ($P(\text{Low Tree}) = 0.30$).
* 21 blocks have both low tree canopy and experience extreme heat ($P(\text{Hot} \cap \text{Low Tree}) = 0.21$).
1. Conditional Risk: $P(\text{Hot} \mid \text{Low Tree}) = \frac{0.21}{0.30} = 0.70$
* **Result:** $70\%$ of the low-canopy blocks in this toy sample also meet the declared heat condition; this is not a causal probability for an individual block.

#### 🧪 Example 3: Eligible-Cell Denominator
* **Given:** $80$ eligible cells, $20$ meet A, $25$ meet B, and $10$ meet both.
1. $P(A\cap B)=10/80=0.125$.
2. $P(A\mid B)=10/25=0.40$.
* **Result:** the quantities describe this eligible sample only. The app keeps population/vulnerability releases governance-gated.

---

### 4.5 Markov Chains & Land-Use Transition Matrices

#### 💡 What is this in plain English?
A **Markov Chain** models how urban land cover transitions over time (e.g., from 2020 to 2030). A **Transition Matrix ($P$)** defines the probabilities of a pixel changing from Vegetation ($V$) or Soil ($S$) into Concrete ($C$) during the next decade.

#### 📐 The Math Formula
$$\mathbf{x}^{(t+1)} = \mathbf{x}^{(t)} \cdot \mathbf{P}$$

* $\mathbf{x}^{(t)}$: State distribution vector at decade $t$.
* $\mathbf{P}$: Transition matrix where rows sum to $1.0$.

#### 🧪 Example 1: Predicting 2030 Land Cover
* **2020 State:** $60\%$ Green Space ($V$), $40\%$ Concrete ($C$) $\rightarrow \mathbf{x}^{(2020)} = [0.60, 0.40]$.
* **Transition Matrix $\mathbf{P}$:**
  $$\mathbf{P} = \begin{bmatrix} 0.80 & 0.20 \\ 0.05 & 0.95 \end{bmatrix}$$
  *(80% of green stays green, 20% becomes concrete; 5% of concrete converted to green, 95% stays concrete).*
1. Multiply vector by matrix:
   * New Green: $(0.60 \times 0.80) + (0.40 \times 0.05) = 0.48 + 0.02 = 0.50$
   * New Concrete: $(0.60 \times 0.20) + (0.40 \times 0.95) = 0.12 + 0.38 = 0.50$
* **Result:** By 2030, land cover shifts to $\mathbf{50\%}$ Green and $\mathbf{50\%}$ Concrete.

#### 🧪 Example 2: Predicting 2040 Land Cover (2 Steps Ahead)
* **2030 State:** $\mathbf{x}^{(2030)} = [0.50, 0.50]$.
1. Multiply vector by matrix $\mathbf{P}$:
   * New Green: $(0.50 \times 0.80) + (0.50 \times 0.05) = 0.40 + 0.025 = 0.425$
   * New Concrete: $(0.50 \times 0.20) + (0.50 \times 0.95) = 0.10 + 0.475 = 0.575$
* **Result:** By 2040, green cover drops further to $\mathbf{42.5\%}$, and concrete rises to $\mathbf{57.5\%}$.

#### 🧪 Example 3: Missing Transition Row
* **Given:** no valid source pixels exist for a land-cover class in the before raster.
1. Its transition-row denominator is $0$.
* **Result:** return the row as **unavailable**, not as a zero-probability or invented transition distribution.

---

### 4.6 Extreme Value Theory (Generalized Extreme Value / GEV Distribution)

#### 💡 What is this in plain English?
Extreme Value Theory (EVT) models the distribution of block maxima or minima. A fitted **GEV Distribution** can estimate rare-event probabilities or return levels only after diagnostics, adequate independent extremes, and uncertainty assessment. The app's optional primitive rejects fewer than 20 maxima and does not publish GEV city outputs.

#### 📐 The Math Formula (Cumulative Distribution Function)
$$F(x; \mu, \sigma, \xi) = \exp\left( -\left[ 1 + \xi \left( \frac{x - \mu}{\sigma} \right) \right]^{-1/\xi} \right)$$

* $\mu$: Location parameter (center of extreme annual maximums).
* $\sigma$: Scale parameter (spread of extreme values).
* $\xi$: Shape parameter (determines tail heavy-ness: Fréchet $\xi > 0$, Gumbel $\xi = 0$, Weibull $\xi < 0$).

For $\xi = 0$, use the continuous Gumbel limit
$F(x)=\exp(-\exp(-(x-\mu)/\sigma))$ rather than dividing by zero.

#### 🧪 Example 1: Illustrative Exceedance Calculation ($\xi = 0.1$, $\mu = 38\text{°C}$, $\sigma = 2.0\text{°C}$, $x = 44\text{°C}$)
1. Normalized deviation: $(44 - 38) / 2.0 = 3.0$
2. Shape term: $1 + 0.1 \times (3.0) = 1 + 0.3 = 1.3$
3. Exponent power: $-1 / 0.1 = -10$
4. Outer bracket: $(1.3)^{-10} = 0.07257$
5. Exponential: $\exp(-0.07257) = 0.92999$
6. Return period probability ($1 - F(x)$): $1 - 0.92999 = 0.07001$
* **Result:** This fitted toy distribution gives a $\mathbf{7.0\%}$ annual exceedance probability, equivalent to a return period of about $14$ years—not 100 years.

#### 🧪 Example 2: Severe Extreme Event ($x = 47\text{°C}$)
1. Normalized deviation: $(47 - 38) / 2.0 = 4.5$
2. Shape term: $1 + 0.1 \times (4.5) = 1.45$
3. Outer bracket: $(1.45)^{-10} = 0.02434$
4. Exponential: $\exp(-0.02434) = 0.97595$
5. Return period probability: $1 - 0.97595 = 0.02405$
* **Result:** Annual probability of exceeding $47\text{°C}$ is $\mathbf{2.4\%}$ (a $\sim 1$-in-$41$ year heatwave).

#### 🧪 Example 3: Sample-Size Release Gate
* **Given:** only $18$ annual block maxima are available.
1. Compare $18<20$, the primitive's minimum finite-sample requirement.
* **Result:** reject the GEV fit. A rare-event curve without adequate extremes, diagnostics, and uncertainty is not a publishable forecast.

---

### 4.7 Risk & Population Exposure Modeling

#### 💡 What is this in plain English?
Hazard, exposure, and vulnerability are often combined in risk frameworks, but choosing, normalizing, and weighting them is a policy and governance decision. A multiplicative score is an illustrative index, not a medical or public-health diagnosis. The current app does not release personal or area-level health-risk scores.

#### 📐 The Math Formula
$$R = H \times E \times V$$

* $H$: Heat Hazard index ($0.0 - 1.0$, based on LST anomaly).
* $E$: Exposure index ($0.0 - 1.0$, population density).
* $V$: Vulnerability index ($0.0 - 1.0$, poverty rate, age $>65$, lack of tree shade).

#### 🧪 Example 1: Hypothetical High-Index Area
* Hazard score $H = 0.90$ ($39\text{°C}$ ground temperature).
* Exposure score $E = 0.85$ ($12,000$ residents per $\text{km}^2$).
* Vulnerability score $V = 0.80$ (High elderly pop, low AC access).
1. Multiply components: $R = 0.90 \times 0.85 \times 0.80 = 0.612$
* **Result:** Illustrative composite index $R = \mathbf{0.612}$ under these arbitrary normalizations; it is not a “critical” designation.

#### 🧪 Example 2: Hypothetical Low-Index Area
* Hazard score $H = 0.30$ ($26\text{°C}$ ground temperature).
* Exposure score $E = 0.20$ ($800$ residents per $\text{km}^2$).
* Vulnerability score $V = 0.15$ (High income, 100% AC access).
1. Multiply components: $R = 0.30 \times 0.20 \times 0.15 = 0.009$
* **Result:** Illustrative composite index $R = \mathbf{0.009}$ under these arbitrary normalizations; it is not a personal or neighbourhood risk finding.

#### 🧪 Example 3: Same Conditions, Different Normalization
* **Given:** a score changes because a city rescales hazard from a percentile to an absolute threshold.
1. $H$, and therefore $R=H\times E\times V$, changes even if the physical scene does not.
* **Result:** composite indices encode policy choices. The app does not publish this as a health-risk map.

---

# 5. Combinatorics & Graph Optimization

> 🟦 **◆ INNOVATION — Bounded optimization with explicit limits.** The app
> makes small-graph exact-cut checks and transparent budget selection available
> as diagnostics and planning aids. It deliberately does not claim a
> citywide-optimal intervention placement.

---

### 5.1 Combinatorial Graph Cuts

#### 💡 What is this in plain English?
A **Graph Cut** partitions the set of city blocks into two distinct mathematical groups ($S$ and $T$). The **Cut Weight** is the exact combinatorial sum of edge weights connecting nodes in $S$ to nodes in $T$.

#### 📐 The Math Formula
$$\text{Cut}(S, T) = \sum_{i \in S, j \in T} w_{ij}$$

#### 🧪 Example 1: Cutting Highway Connections Between 2 Zones
* Set $S = \{\text{Downtown}, \text{Financial District}\}$.
* Set $T = \{\text{Suburbs}, \text{Airport}\}$.
* Road connections crossing from $S$ to $T$:
  * Main Expressway ($w_{13} = 12$)
  * Secondary Arterial ($w_{24} = 4$)
1. Sum edge weights: $12 + 4 = 16$
* **Result:** $\text{Cut}(S, T) = \mathbf{16}$.

#### 🧪 Example 2: Cutting a Low-Traffic Rural Boundary
* Set $S = \{\text{Village A}, \text{Village B}\}$.
* Set $T = \{\text{City Core}\}$.
* Only 1 narrow dirt road connects them ($w_{12} = 1.5$).
1. Sum edge weights: $1.5$
* **Result:** $\text{Cut}(S, T) = \mathbf{1.5}$.

#### 🧪 Example 3: Same Cut Weight, Different Conductance
* **Given:** two cuts each have weight $2$, but one smaller-side volume is $10$ and the other is $100$.
1. Conductance values: $2/10=0.20$ and $2/100=0.02$.
* **Result:** raw cut weight alone does not express bottleneck strength; conductance accounts for the size of the separated graph region.

---

### 5.2 Minimum Cut / Maximum Flow Algorithm

#### 💡 What is this in plain English?
The **Max-Flow Min-Cut Theorem** states that the maximum feasible flow in a directed, capacity-labelled network equals the capacity of its smallest source–sink cut. It applies only when edge capacities have a defensible flow meaning; this app's min-cut primitive is a framework utility and does not model heat diffusion, traffic, or access by default.

```
[ Source S: Industrial Heat Center ] == (Cap: 10) ==> [ Node A ] == (Cap: 7) ==> [ Sink T: Cool Park ]
                                     == (Cap: 5)  ==> [ Node B ] == (Cap: 4) ==> [ Sink T: Cool Park ]
```

#### 📐 The Math Formula
$$\text{MaxFlow}(s \to t) = \min_{U:\,s\in U,\,t\notin U} \operatorname{cap}(U, V\setminus U)$$

#### 🧪 Example 1: Capacity-Network Bottleneck
* From Source $S$ (Industrial District):
  * Pipe 1 to Node $A$ has capacity $10$. Pipe 2 to Node $B$ has capacity $5$.
* From intermediate nodes to Sink $T$ (Cool River District):
  * Node $A \to T$ has capacity $7$.
  * Node $B \to T$ has capacity $4$.
1. Max flow through path $S \to A \to T = \min(10, 7) = 7$.
2. Max flow through path $S \to B \to T = \min(5, 4) = 4$.
3. Total Max Flow = $7 + 4 = 11$.
* **Result:** The minimum source–sink cut capacity is $\mathbf{11}$ in this directed capacity example.

#### 🧪 Example 2: Upgrading a Road Bottleneck
* If Node $B \to T$ capacity is upgraded from $4$ to $8$:
1. Flow through $S \to B \to T = \min(5, 8) = 5$.
2. Total Max Flow = $7 + 5 = 12$.
* **Result:** Network capacity rises to $\mathbf{12}$, bounded by the capacity of link $S \to B$.

#### 🧪 Example 3: Capacity Must Be Declared
* **Given:** a graph edge has only a thermal conductance proxy, not a measured capacity.
1. There is no justified conversion from that proxy to litres/second, vehicles/hour, people/hour, or watts.
* **Result:** do not run or interpret max flow as a physical service or heat-flow result. The app's min-cut helper requires an explicit capacity field.

---

### 5.3 Permutations & Combinations for Spatial Subgraphs

#### 💡 What is this in plain English?
* **Combinations $\binom{n}{k}$:** How many unique ways can we select $k$ city blocks out of $n$ total blocks to install urban cooling centers (where order doesn't matter)?
* **Permutations $P(n, k)$:** How many unique ordered routes can an inspection team take to visit $k$ out of $n$ priority hotspots?

#### 📐 The Math Formulas
$$\text{Combinations: } \binom{n}{k} = \frac{n!}{k!(n - k)!}$$
$$\text{Permutations: } P(n, k) = \frac{n!}{(n - k)!}$$

#### 🧪 Example 1: Choosing 3 Neighborhoods for Cooling Infrastructure
* Out of $n = 8$ candidate heat-vulnerable neighborhoods, we have budget to fund $k = 3$ cooling centers.
1. Factorials: $8! = 40,320$; $3! = 6$; $(8-3)! = 5! = 120$.
2. Combinations: $\frac{40,320}{6 \times 120} = \frac{40,320}{720} = 56$
* **Result:** There are $\mathbf{56}$ unique combinations of neighborhoods to receive cooling centers.

#### 🧪 Example 2: Ordering a 3-Stop Emergency Inspection Route
* An inspector must visit $k = 3$ out of $n = 8$ hotspot sites in a specific sequence.
1. Permutations: $\frac{8!}{(8-3)!} = \frac{40,320}{120} = 336$
* **Result:** There are $\mathbf{336}$ distinct ordered inspection routes.

#### 🧪 Example 3: Why Exact Enumeration Has a Limit
* **Given:** a 16-node graph.
1. Unique non-empty complementary cut candidates: $(2^{16}-2)/2=32,767$.
* **Result:** exact checking is useful for a small diagnostic graph, but rapidly becomes impractical for a city-scale raster graph.

---

### 5.4 NP-Hard Partitioning & Greedy Heuristics

#### 💡 What is this in plain English?
Finding an exact balanced partition of a large graph can be NP-hard; exhaustive enumeration scales exponentially (roughly $2^{n-1}-1$ non-trivial complementary cuts before additional constraints), so it is infeasible at city scale.

Heuristics can give a useful candidate solution quickly, but “near-optimal” requires a stated comparison or bound. The current app uses a Fiedler sweep for a conductance candidate and bounded exact enumeration only for small diagnostic graphs; its scenario action selection uses transparent greedy/budget rules rather than a citywide partitioning guarantee.

#### 📐 Step-by-Step Greedy Heuristic Algorithm
1. Start with every node in its own tiny district cluster.
2. Calculate the Modularity Gain ($\Delta Q$) for merging every neighboring pair of clusters.
3. Merge the specific pair that yields the largest positive increase in modularity ($\Delta Q > 0$).
4. Repeat steps 2–3 until no merge can increase modularity further.

#### 🧪 Example 1: Greedy Merge of 3 Districts
Current clusters: $C_1, C_2, C_3$.
* Potential merges:
  * Merge $(C_1, C_2) \rightarrow \Delta Q = +0.12$
  * Merge $(C_1, C_3) \rightarrow \Delta Q = +0.03$
  * Merge $(C_2, C_3) \rightarrow \Delta Q = -0.05$
1. The greedy algorithm selects merge $(C_1, C_2)$ because $+0.12$ is the highest gain.
* **Result:** New cluster formed $\{C_1, C_2\}$ in step 1.

#### 🧪 Example 2: Stopping Condition Reached
Remaining clusters: $C_{12}, C_3$.
* Potential merge $(C_{12}, C_3) \rightarrow \Delta Q = -0.08$.
1. Because $\Delta Q < 0$, merging decreases graph partition quality.
* **Result:** Greedy algorithm halts and returns final partition $\{C_{12}\}$ and $\{C_3\}$.

#### 🧪 Example 3: Transparent Greedy Budget Choice
* **Given:** a $100,000$ planning budget and ranked candidate actions costing $60,000$, $50,000$, and $35,000$.
1. A declared greedy rule might select the $60,000$ action first, skip the $50,000$ action because it exceeds the remainder, then select the $35,000$ action.
2. Total allocation: $60,000+35,000=95,000$.
* **Result:** the choice is reproducible under its rule, but a different objective or exact knapsack search can choose differently. It is not a citywide-optimal intervention plan.

---

# Appendix A — App-Grounded Implementation Notes for Every Concept

These notes expand the in-section Example 3 material with the repository's
actual implementation status. An **active** note may describe a real product
calculation, while a **framework** note demonstrates a reusable primitive
without implying that it has been released as a city finding.

### 1.1 Implementation note: Declared DN-to-radiance adapter ◇ FRAMEWORK

For `DN = 15,000`, `M_L = 0.0003342`, and `A_L = 0.1`,
`L = 15,000(0.0003342)+0.1 = 5.113`. The function
`dn_to_radiance` performs this only when an adapter supplies product-specific
metadata. It is not silently applied to the prepared Boston arrays.

### 1.2 Implementation note: Positive-radiance guard ◇ FRAMEWORK

`brightness_temperature_kelvin` returns a value only where radiance is
positive; a fill value or `L <= 0` becomes `NaN`, not an invented temperature.
With declared `K1/K2`, this makes invalid-source handling inspectable.

### 1.3 Implementation note: Compatible-band NDVI ◇ FRAMEWORK / input-active

For compatible reflectance values `NIR = 0.42` and `RED = 0.18`,
`NDVI = (0.42-0.18)/(0.42+0.18) = 0.40`. The active pipeline can consume a
prepared NDVI raster; direct band-ratio calculation remains adapter-gated.

### 1.4 Implementation note: Endpoint clipping ◇ FRAMEWORK

With `NDVI = 0.90`, `NDVI_min = 0.20`, and `NDVI_max = 0.80`, the raw fraction
is above 1, so `fractional_vegetation_cover` clips it to `1² = 1`. Clipping
prevents an endpoint choice from producing impossible cover values.

### 1.5 Implementation note: Declared emissivity model ◇ FRAMEWORK

For `P_v = 1`, the guide's declared model gives
`ε = 0.986 + 0.004(1) = 0.990`. This is a parameterized estimate, not a
universal material property or a current Boston emissivity map.

### 1.6 Implementation note: Single-channel estimate ◇ FRAMEWORK

For `T_b = 300 K`, `ε = 0.99`, `λ = 10.9 μm`, and `ρ = 14,388 μm·K`, the
formula yields about `27.5°C`. The app requires declared wavelength and
emissivity inputs; it does not promote this number as a calibrated field value.

### 1.7 Implementation note: Coefficients are part of the evidence ◇ FRAMEWORK

Two scenes with the same `T_b10` and `T_b11` but different water vapour or
sensor coefficients can yield different estimates. The primitive therefore
requires every coefficient explicitly; no generic “Landsat split-window” value
is emitted for the bundled study.

### 2.1 Implementation note: Raster adjacency 🟦 ◆ INNOVATION — active

For two valid neighbouring prepared cells, the app records one undirected edge
with `w = exp(-αg)(1 + β·mean(NDVI))`. A missing cell creates no node and no
edge. This makes the adjacency rule and its data gaps explicit.

### 2.2 Implementation note: Weighted degree 🟦 ◆ INNOVATION — active

If a cell has three adjacent edge weights `0.4`, `0.5`, and `0.7`, its weighted
degree is `1.6`. The degree is graph support under the declared conductance
rule—not a count of roads, trees, or services.

### 2.3 Implementation note: Difference operator ◇ SUPPORTING MATH

For a node with degree `1.6` and neighbour weights `0.4, 0.5, 0.7`, its
Laplacian row has diagonal `1.6` and off-diagonals `-0.4, -0.5, -0.7`; the row
sums to zero. This algebra supports the spectral calculation, not a heat-flow
simulation.

### 2.4 Implementation note: Normalized-Laplacian input 🟦 ◆ INNOVATION — active

The app computes `Lsym = D^-1/2(D-A)D^-1/2` from the weighted raster graph
before finding the second eigenpair. Normalization keeps high-degree cells from
dominating the structural signal solely because they have more graph support.

### 3.1 Implementation note: Connectivity signal 🟦 ◆ INNOVATION — active

`lambda2_and_fiedler` returns `λ₂`, an ordered Fiedler vector, node order, and
weighted degree. If the graph is disconnected, `λ₂ = 0` and downstream code
must treat a unique bottleneck interpretation as unavailable.

### 3.2 Implementation note: Sweep conductance candidate 🟦 ◆ INNOVATION — active

Given a Fiedler ordering, the app evaluates each non-empty prefix. If a prefix
has cut weight `2`, volume `50`, and complement volume `70`, its conductance is
`2/min(50,70) = 0.04`. It reports the best sweep candidate, not the global
Cheeger optimum.

### 3.3 Implementation note: Exact-check diagnostic ◇ FRAMEWORK

For a small graph of at most 16 nodes, `fiedler_exact_cut_benchmark` can
enumerate complementary cuts and compare the sweep result with the exact
conductance optimum. This is a quality check for the heuristic, not a
city-scale exhaustive search.

### 3.4 Implementation note: Deterministic clusters ◇ FRAMEWORK

`spectral_clusters` can return labels and eigenvalues for a declared graph and
cluster count. A city map does not currently render those labels, because a
cluster still needs an interpretation and validation contract before release.

### 3.5 Implementation note: Partition diagnostic ◇ FRAMEWORK

The same clustering primitive reports weighted modularity for its declared
partition. It helps compare partition structure, but it does not independently
validate a thermal district or a planning boundary.

### 4.1 Implementation note: Global pattern metadata 🟦 ◆ INNOVATION — preview-gated

For a finite 2-D thermal field with rook neighbours, `moran_lisa` calculates a
global Moran's I and records it in layer quality metadata. It describes spatial
association in that one declared field; it is not a citywide causal conclusion.

### 4.2 Implementation note: FDR-adjusted LISA preview 🟦 ◆ INNOVATION — preview-gated

The bundled preview runs at least 99 permutations (currently 99 in the map
adapter), uses a fixed seed, then applies Benjamini–Hochberg adjustment before
categorizing significant cells as high-high, low-low, high-low, or low-high.
It is hidden by default and labelled computationally verified.

### 4.3 Implementation note: Documented density ◇ FRAMEWORK

With 20 documented seasonal observations, `empirical_density(values, bins=5)`
returns bin edges, density, and the sample size `20`. It does not call the
histogram a heat-wave forecast or attach a medical threshold.

### 4.4 Implementation note: Explicit denominator ◇ FRAMEWORK / governance-gated

If 80 cells are eligible, 20 meet A, 25 meet B, and 10 meet both, the primitive
reports joint share `10/80 = 0.125` and `P(A|B) = 10/25 = 0.4`. These are
descriptive area proportions; population/vulnerability publication is blocked
without governance approval.

### 4.5 Implementation note: Transition counts before prediction ◇ FRAMEWORK

`markov_transition_matrix` first returns observed class-transition counts and
row-normalized probabilities for harmonized before/after rasters. A row with no
observations remains unavailable rather than inventing a transition rate.

### 4.6 Implementation note: Minimum-sample GEV gate ○ RESEARCH-ONLY

`fit_gev_block_maxima` rejects fewer than 20 finite maxima. Even after a fit,
the current primitive supplies no return-level uncertainty or diagnostics, so
no city artifact may represent it as an extreme-heat forecast.

### 4.7 Implementation note: No public risk map ○ GATED

An exposure/context layer with social data must pass the layer validator's
governance requirement before public release. The current platform makes no
personal, health-risk, or area-risk claim from the illustrative `H×E×V` index.

### 5.1 Implementation note: Candidate cut versus all cuts 🟦 ◆ INNOVATION — active approximation

For a 100-cell graph, the app does not enumerate roughly `2^99-1` complementary
partitions. It evaluates the small family of Fiedler-order sweep prefixes, then
labels the result a candidate structural break that merits local inspection.

### 5.2 Implementation note: Capacity-labelled network ◇ FRAMEWORK

`minimum_cut_summary` requires an explicit graph, source, target, and capacity
attribute. A raster edge's thermal conductance is not automatically treated as
a physical flow capacity, which prevents a misleading “heat-flow” claim.

### 5.3 Implementation note: Bounded combinations ◇ FRAMEWORK

The exact-cut benchmark limits enumeration to 16 nodes. At 16 nodes there are
at most `2^15-1 = 32,767` complementary non-empty candidates before pruning;
that bound keeps diagnostic computation auditable and safe.

### 5.4 Implementation note: Transparent budget choice 🟦 ◆ INNOVATION — planning-gated

Scenario selection can rank or allocate a bounded intervention list under a
declared budget and evidence state. Its output is a transparent planning
comparison—not a proof of optimal citywide placement, cooling benefit, or
procurement readiness.

---

# Appendix B — Plain-English Symbols & Units for Every Formula

Use this appendix beside any formula in the guide. It spells out what each
symbol means, whether it has a physical unit, and how to read the output.

## First, three rules that make units easier

1. **Physical measurements have units.** Temperature might be in Kelvin (`K`)
   or degrees Celsius (`°C`); radiance has the longer unit explained in Section
   1.1; distance might be metres (`m`). Never add or compare values with
   different units until they are converted.
2. **Ratios and normalized indices have no unit.** NDVI, emissivity, a
   probability, a percentile-normalized raster, and many graph scores are
   **dimensionless**. A dimensionless value can still be useful, but it is not
   automatically a temperature, percent, or health risk.
3. **Graph units come from the chosen edge rule.** If an edge weight is a
   thermal/vegetation conductance proxy, then degree, cut, and conductance
   describe that proxy graph—not roads, watts, people, or physical heat flow.

## 1. Remote-sensing and thermal terms

| Section | Symbol or unit, spelled out | How to read it |
| --- | --- | --- |
| 1.1 | `DN` = **digital number**, a stored pixel code; no physical unit. `M_L` = radiance per DN; `A_L` = radiance offset, both in the output radiance unit. | DN becomes radiance only with the matching product metadata. |
| 1.1 | `L_λ` = **spectral radiance** in `W·m⁻²·sr⁻¹·μm⁻¹`: watts per square metre per steradian per micrometre. | Radiant power per area, viewing direction, and wavelength interval—not a temperature. |
| 1.2 | `K1` = sensor-specific radiance constant in the same radiance unit as `L_λ`; `K2` = sensor-specific constant in Kelvin; `T_b` = **brightness temperature**. | The repository helper returns `T_b` in **Kelvin**; subtract `273.15` only when a Celsius value is needed. |
| 1.3 | `NIR` = near-infrared reflectance; `RED` = red-band reflectance. Both must use compatible, unitless reflectance scaling. | `NDVI` ranges roughly from `-1` to `+1`; it is a vegetation signal, not canopy percentage. |
| 1.4 | `P_v` / FVC = **fractional vegetation-cover proxy**; no unit, bounded `0–1`. `NDVI_min/max` are chosen reference endpoints. | `0.64` means the model returned a higher proxy value under those endpoints—not proven 64% tree canopy. |
| 1.5 | `ε` (epsilon) = **emissivity**, a unitless ratio typically between `0` and `1`. | It describes the declared radiation-emission model; it is not a universal lookup value for every material. |
| 1.6 | `λ` (lambda) = wavelength, here in micrometres (`μm`); `ρ` (rho) = radiation constant in `μm·K`; `T_b` is Kelvin. | Unit consistency is essential: use micrometres with `ρ` in `μm·K`, then convert the final Kelvin estimate to `°C` if desired. |
| 1.7 | `T_b10`, `T_b11` = brightness temperatures from two declared thermal channels; `W` = water-vapour quantity in the units used by its calibration. | Coefficients `c`, `a`, and `b` carry the units needed to make the result a temperature; they cannot be reused across sensors without validation. |

## 2. Graph terms

| Section | Symbol or unit, spelled out | How to read it |
| --- | --- | --- |
| 2.1 | `A` = **adjacency matrix**; `A_ij` is the declared edge weight from node `i` to node `j`. | In the active app, nodes are valid raster cells and `A_ij` is a unitless conductance proxy. |
| 2.2 | `D` = **degree matrix**; `D_ii` is the sum of weights attached to node `i`. | Degree inherits the edge-weight meaning. It is graph support, not a number of physical connections. |
| 2.3 | `L = D − A` = **unnormalized graph Laplacian**. | Its entries inherit edge-weight units; it is a structural difference operator, not automatically a diffusion rate. |
| 2.4 | `L_sym` = **symmetric normalized graph Laplacian**; `I` = identity matrix. | `L_sym` is dimensionless. Its eigenvalues are in `[0, 2]` for the standard non-negative undirected construction. |

## 3. Spectral and partition terms

| Section | Symbol or unit, spelled out | How to read it |
| --- | --- | --- |
| 3.1 | `λ₂` (lambda two) = second-smallest normalized-Laplacian eigenvalue; `v₂` = its eigenvector. | `λ₂` is dimensionless in the normalized graph. Larger values mean stronger connectivity in the declared graph, not a cooler place. |
| 3.2 | `h(G)` or `φ(S)` = **conductance** of graph `G` or subset `S`; `∂S` = edges crossing the subset boundary; `vol(S)` = sum of degrees in `S`. | Conductance is dimensionless because it divides a cut weight by a degree-volume. Smaller values indicate a weaker graph connection. |
| 3.3 | `λ₂/2 ≤ h(G) ≤ √(2λ₂)` = a **Cheeger inequality** bound. | It bounds graph conductance under the normalized-Laplacian convention; it does not validate an individual map boundary. |
| 3.4 | `k` = requested number of clusters; `U` = matrix of selected eigenvectors. | Cluster labels are categories, not temperatures or policy zones. |
| 3.5 | `Q` = **modularity**, a unitless comparison with a declared null model; `m` = total edge weight; `k_i` = node degree. | Higher positive `Q` can support a partition comparison, but no universal cutoff proves a meaningful district. |

## 4. Statistics, probability, and context terms

| Section | Symbol or unit, spelled out | How to read it |
| --- | --- | --- |
| 4.1 | `I` = **Global Moran's I**; `N` = number of units; `S₀` = sum of spatial weights; `x_i` = measured value at unit `i`; `x̄` = mean. | Moran's I is unitless. Its interpretation depends on the spatial weights and a significance/null procedure. |
| 4.2 | `I_i` = **Local Moran statistic** for unit `i`; `s²` = declared variance standardization; `w_ij` = spatial weight. | A local score is not a hotspot label until the neighbour rule and significance correction are applied. |
| 4.3 | `f(x)` = **probability density** at value `x`; `μ` = mean; `σ` = standard deviation. | If `x` is in `°C`, density is “per °C.” A density at one point is not a probability; integrate over a range for probability. |
| 4.4 | `P(A∩B)` = probability/share that conditions A and B both occur; `P(A|B)` = share with A among units with B. | Both are unitless proportions from `0–1`. They describe the eligible sample, not causal or individual risk. |
| 4.5 | `x^(t)` = state distribution at time `t`; `P` = transition-probability matrix. | Entries are unitless proportions and each valid row of `P` sums to `1`. A transition estimate needs harmonized time-stamped classes. |
| 4.6 | `F(x)` = cumulative probability up to `x`; `μ` = location, `σ` = scale (same unit as `x`, such as `°C`), `ξ` = shape (unitless). | `1−F(x)` is an exceedance probability. A return period is approximately its reciprocal only under the stated annual/block-maxima model. |
| 4.7 | `H`, `E`, `V` = normalized hazard, exposure, and vulnerability components; `R` = their illustrative product. | All are dimensionless indexes. Their normalizations and weights are normative choices, so `R` is not a medical or public-health measure. |

## 5. Combinatorics and optimization terms

| Section | Symbol or unit, spelled out | How to read it |
| --- | --- | --- |
| 5.1 | `S`, `T` = two complementary node sets; `Cut(S,T)` = sum of declared weights that cross between them. | Cut weight inherits the graph-weight meaning; it is not automatically a road count or heat-flow amount. |
| 5.2 | `s`, `t` = source and target; `cap(U,V\U)` = total capacity of edges leaving set `U`. | Capacity must have a defensible real-world unit before max-flow/min-cut can support a physical interpretation. |
| 5.3 | `n!` = factorial, `n×(n−1)×…×1`; `C(n,k)` = combinations; `P(n,k)` = permutations. | These are counts with no physical unit. Combinations ignore order; permutations preserve order. |
| 5.4 | `ΔQ` (delta Q) = change in modularity after a candidate move or merge. | `ΔQ` is unitless. A positive greedy step improves that stated objective locally; it does not prove a global optimum. |

## Fast unit-conversion reminders

| Convert | Rule | Example |
| --- | --- | --- |
| Kelvin to Celsius | `°C = K − 273.15` | `300 K = 26.85°C` |
| Celsius to Kelvin | `K = °C + 273.15` | `35°C = 308.15 K` |
| Fraction to percent | `percent = fraction × 100` | `0.64 = 64%` — only when the fraction already represents a percentage quantity. |
| Density to probability | Integrate over a range; do **not** multiply a density by 100. | `f(35)=0.0216 per °C` is a density, not `2.16%`. |

> 🟦 **◆ INNOVATION — learning value.** This guide now keeps units,
> assumptions, implementation status, worked math, and release boundaries in
> the same learning path. That transparency is the product innovation; the
> individual equations are established methods.
