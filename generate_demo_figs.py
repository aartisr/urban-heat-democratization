import numpy as np
import matplotlib.pyplot as plt

# 1. Surface temperature map (urban heat island)
np.random.seed(42)
city = np.zeros((100, 100))
# Simulate a hot urban core
city[30:70, 30:70] += 5
# Add random noise
city += np.random.normal(0, 1, city.shape)
# Add a cool park
city[60:80, 10:30] -= 3
plt.figure(figsize=(4,4))
plt.title('Surface Temperature (Urban Heat Island)')
plt.imshow(city, cmap='inferno')
plt.axis('off')
plt.colorbar(label='Temperature (°C)')
plt.tight_layout()
plt.savefig('fig_traditional.png', dpi=120)
plt.close()

# 2. NDVI/Green Index map
ndvi = np.random.uniform(0.2, 0.8, city.shape)
# Simulate high NDVI in parks
ndvi[60:80, 10:30] += 0.4
# Simulate low NDVI in urban core
ndvi[30:70, 30:70] -= 0.2
ndvi = np.clip(ndvi, 0, 1)
plt.figure(figsize=(4,4))
plt.title('NDVI / Green Index')
plt.imshow(ndvi, cmap='Greens', vmin=0, vmax=1)
plt.axis('off')
plt.colorbar(label='NDVI')
plt.tight_layout()
plt.savefig('fig_ndvi.png', dpi=120)
plt.close()

# 3. Spatial statistics/regression map
# Simulate a regression: heat = a*urban + b*green + noise
urban = np.zeros_like(city)
urbandx, urbandy = np.meshgrid(np.linspace(-1,1,100), np.linspace(-1,1,100))
urbandist = np.sqrt(urbandx**2 + urbandy**2)
urbandist = 1 - urbandist/urbandist.max()
urbandist = np.clip(urbandist, 0, 1)
urban[30:70, 30:70] = urbandist[30:70, 30:70]
regression = 3*urban - 2*ndvi + np.random.normal(0, 0.5, city.shape)
plt.figure(figsize=(4,4))
plt.title('Spatial Regression: Heat vs Land Use')
plt.imshow(regression, cmap='coolwarm')
plt.axis('off')
plt.colorbar(label='Regression Output')
plt.tight_layout()
plt.savefig('fig_stats.png', dpi=120)
plt.close()
