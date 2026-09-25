# ⚡ Sorting Algorithm Visualizer Studio

A high-performance, interactive web application to visualize how popular sorting algorithms work step-by-step with real-time audio reactivity, step-by-step control, and detailed performance metrics.

🔗 **Live Demo**: [https://manju1303.github.io/visualization-charts/](https://manju1303.github.io/visualization-charts/)  
📦 **Repository**: [https://github.com/manju1303/visualization-charts](https://github.com/manju1303/visualization-charts)

---

## ✨ Features

- **7 Sorting Algorithms**:
  - **Bubble Sort** (with early termination optimization)
  - **Selection Sort**
  - **Insertion Sort**
  - **Merge Sort** (Divide and conquer)
  - **Quick Sort** (Lomuto partition with pivot glow)
  - **Heap Sort** (Max-heap construction and extraction)
  - **Shell Sort** (Adaptive gap sequence)
- **Audio-Reactive Synthesizer**: Web Audio API oscillator mapping bar heights to musical frequencies during comparisons and swaps (with on/off toggle).
- **Step-by-Step Execution**: Single-step debug mode (`Step` button) to walk through algorithms comparison-by-comparison for educational understanding.
- **Distribution Presets**:
  - Random Order
  - Nearly Sorted (90% sorted with few random perturbations)
  - Reverse Sorted (Worst-case stress testing)
  - Few Unique Values (Tests stability and duplicates handling)
- **Dynamic Performance Metrics**:
  - Comparisons counter
  - Swaps & Overwrites counter
  - Array access count
  - Accurate elapsed time ticker (pauses when paused)
  - Progress percentage indicator with celebratory completion sweep
- **Ultra-Modern Glassmorphic Dark UI**:
  - Smooth glowing CSS gradients
  - Ambient animated background blobs
  - Fully responsive percentage-based bar scaling on mobile, tablet, and desktop
  - Comprehensive complexity and algorithm stability cards

---

## 🚀 Algorithms & Complexity Overview

| Algorithm | Best Time | Average Time | Worst Time | Space Complexity | Stability |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Bubble Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | Stable |
| **Selection Sort** | $O(n^2)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | Unstable |
| **Insertion Sort** | $O(n)$ | $O(n^2)$ | $O(n^2)$ | $O(1)$ | Stable |
| **Merge Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(n)$ | Stable |
| **Quick Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n^2)$ | $O(\log n)$ | Unstable |
| **Heap Sort** | $O(n \log n)$ | $O(n \log n)$ | $O(n \log n)$ | $O(1)$ | Unstable |
| **Shell Sort** | $O(n \log n)$ | $O(n^{4/3})$ | $O(n^2)$ | $O(1)$ | Unstable |

---

## 🛠️ Built With

- **HTML5**: Semantic tags, accessible attributes, and responsive layout
- **Vanilla CSS3**: Modern CSS custom properties, glassmorphism, responsive flexbox, and keyframe animations
- **Modern JavaScript (ES6+)**: Asynchronous algorithms, Promises, Web Audio API, and custom execution controller

---

## 💻 Local Development

Run locally using any static file server:

```bash
# Using Python
python -m http.server 8080

# Or using Node.js
npx serve .
```

Open `http://localhost:8080` in your web browser.

---

## 👤 Author

**Manjunath (manju1303)**  
- GitHub: [@manju1303](https://github.com/manju1303)
- Live App: [https://manju1303.github.io/visualization-charts/](https://manju1303.github.io/visualization-charts/)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
