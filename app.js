/**
 * ============================================================================
 * SORTING ALGORITHM VISUALIZER STUDIO
 * High-performance, audio-reactive algorithm visualizer with step control,
 * multi-distribution generation, and responsive rendering.
 * ============================================================================
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.init();
        }
        return this.enabled;
    }

    playTone(value, maxValue = 100, type = 'sine') {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Map bar height to frequency (160Hz to 880Hz)
            const ratio = Math.max(0.05, Math.min(1, value / maxValue));
            const freq = 160 + (ratio * 720);

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.045);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.045);
        } catch (e) {
            // Audio context safely ignored on restrictions
        }
    }
}

class SortingVisualizer {
    constructor() {
        this.array = [];
        this.initialArray = [];
        this.arraySize = 50;
        this.animationSpeed = 5;
        this.distribution = 'random';
        this.maxValue = 100;

        // State Flags
        this.isPlaying = false;
        this.isPaused = false;
        this.isStepMode = false;
        this.stepResolve = null;
        this.cancelReject = null;
        this.timeoutId = null;
        this.currentAlgorithm = 'bubble';

        // Performance Statistics
        this.comparisons = 0;
        this.swaps = 0;
        this.arrayAccess = 0;
        this.elapsedTime = 0;
        this.timerInterval = null;

        // Sound Engine
        this.sound = new SoundEngine();

        // Algorithm Metadata
        this.algorithms = {
            bubble: {
                name: "Bubble Sort",
                stability: "Stable",
                timeComplexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
                spaceComplexity: "O(1)",
                description: "Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order."
            },
            selection: {
                name: "Selection Sort",
                stability: "Unstable",
                timeComplexity: { best: "O(n²)", average: "O(n²)", worst: "O(n²)" },
                spaceComplexity: "O(1)",
                description: "Divides the input list into sorted and unsorted regions, repeatedly finding the minimum element from the unsorted region."
            },
            insertion: {
                name: "Insertion Sort",
                stability: "Stable",
                timeComplexity: { best: "O(n)", average: "O(n²)", worst: "O(n²)" },
                spaceComplexity: "O(1)",
                description: "Builds the final sorted array one item at a time by repeatedly taking the next element and inserting it into the sorted portion."
            },
            merge: {
                name: "Merge Sort",
                stability: "Stable",
                timeComplexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
                spaceComplexity: "O(n)",
                description: "Divide-and-conquer algorithm that divides the array in halves, recursively sorts them, and merges the sorted halves."
            },
            quick: {
                name: "Quick Sort",
                stability: "Unstable",
                timeComplexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)" },
                spaceComplexity: "O(log n)",
                description: "Selects a pivot element and partitions the other elements into two sub-arrays according to whether they are less than or greater than the pivot."
            },
            heap: {
                name: "Heap Sort",
                stability: "Unstable",
                timeComplexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n log n)" },
                spaceComplexity: "O(1)",
                description: "Builds a max-heap from the input data, then repeatedly extracts the maximum element and moves it to the sorted region."
            },
            shell: {
                name: "Shell Sort",
                stability: "Unstable",
                timeComplexity: { best: "O(n log n)", average: "O(n^(4/3))", worst: "O(n²)" },
                spaceComplexity: "O(1)",
                description: "Optimization of insertion sort that allows exchanges of far-apart items using decreasing gap sequences."
            }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.generateArray(this.distribution);
        this.updateAlgorithmInfo();
        this.updateStatistics();
        this.setStatus('Ready. Select an algorithm and click Play or Step.');

        window.addEventListener('resize', () => {
            this.updateBarLabels();
        });
    }

    bindEvents() {
        // Algorithm selection - Using event delegation & closest to prevent dot-click bug
        const algoContainer = document.getElementById('algorithm-buttons');
        if (algoContainer) {
            algoContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.algo-chip');
                if (btn && !this.isPlaying) {
                    const algo = btn.dataset.algorithm;
                    if (algo && this.algorithms[algo]) {
                        this.selectAlgorithm(algo);
                    }
                }
            });
        }

        // Array size slider
        const arraySizeSlider = document.getElementById('array-size');
        if (arraySizeSlider) {
            arraySizeSlider.addEventListener('input', (e) => {
                if (!this.isPlaying) {
                    this.arraySize = parseInt(e.target.value, 10);
                    const label = document.getElementById('array-size-value');
                    if (label) label.textContent = this.arraySize;
                    this.generateArray(this.distribution);
                }
            });
        }

        // Distribution preset dropdown
        const presetSelect = document.getElementById('array-preset');
        if (presetSelect) {
            presetSelect.addEventListener('change', (e) => {
                if (!this.isPlaying) {
                    this.distribution = e.target.value;
                    this.generateArray(this.distribution);
                }
            });
        }

        // Speed slider
        const speedSlider = document.getElementById('speed');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.animationSpeed = parseInt(e.target.value, 10);
                const label = document.getElementById('speed-value');
                if (label) label.textContent = this.animationSpeed;
            });
        }

        // Sound toggle button
        const soundBtn = document.getElementById('sound-toggle');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const active = this.sound.toggle();
                soundBtn.classList.toggle('active', active);
                const soundIcon = document.getElementById('sound-icon');
                const soundText = document.getElementById('sound-text');
                if (soundIcon) soundIcon.textContent = active ? '🔊' : '🔇';
                if (soundText) soundText.textContent = active ? 'Sound On' : 'Sound Off';
            });
        }

        // Control buttons
        const playBtn = document.getElementById('play-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stepBtn = document.getElementById('step-btn');
        const resetBtn = document.getElementById('reset-btn');
        const generateBtn = document.getElementById('generate-array');

        if (playBtn) playBtn.addEventListener('click', () => this.play());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (stepBtn) stepBtn.addEventListener('click', () => this.step());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                if (!this.isPlaying) {
                    this.generateArray(this.distribution);
                }
            });
        }

        // Global Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            if (e.code === 'Space') {
                e.preventDefault();
                if (this.isPlaying && !this.isPaused) {
                    this.pause();
                } else {
                    this.play();
                }
            } else if (e.key === 'r' || e.key === 'R') {
                this.reset();
            } else if (e.key === 's' || e.key === 'S') {
                this.step();
            } else if (e.key === 'n' || e.key === 'N') {
                if (!this.isPlaying) {
                    this.generateArray(this.distribution);
                }
            }
        });
    }

    selectAlgorithm(algorithm) {
        document.querySelectorAll('.algo-chip').forEach(btn => btn.classList.remove('active'));
        const selectedBtn = document.querySelector(`[data-algorithm="${algorithm}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        this.currentAlgorithm = algorithm;
        this.updateAlgorithmInfo();
        this.setStatus(`Selected ${this.algorithms[algorithm].name}. Press Play to start.`);
        this.reset();
    }

    generateArray(type = 'random') {
        this.array = [];
        const n = this.arraySize;

        switch (type) {
            case 'nearly-sorted':
                for (let i = 1; i <= n; i++) {
                    this.array.push(Math.round((i / n) * 95) + 5);
                }
                // Swap ~10% of items to make it nearly sorted
                const swapsCount = Math.max(2, Math.floor(n * 0.08));
                for (let s = 0; s < swapsCount; s++) {
                    const idx1 = Math.floor(Math.random() * n);
                    const idx2 = Math.floor(Math.random() * n);
                    [this.array[idx1], this.array[idx2]] = [this.array[idx2], this.array[idx1]];
                }
                break;

            case 'reversed':
                for (let i = n; i >= 1; i--) {
                    this.array.push(Math.round((i / n) * 95) + 5);
                }
                break;

            case 'few-unique':
                const levels = [20, 45, 70, 95];
                for (let i = 0; i < n; i++) {
                    this.array.push(levels[Math.floor(Math.random() * levels.length)]);
                }
                break;

            case 'random':
            default:
                for (let i = 0; i < n; i++) {
                    this.array.push(Math.floor(Math.random() * 92) + 8);
                }
                break;
        }

        // Store copy for reliable Reset
        this.initialArray = [...this.array];
        this.renderArray();
        this.resetStatistics();
        this.setStatus(`Generated new ${type} array (${n} items).`);
    }

    renderArray() {
        const container = document.getElementById('array-container');
        if (!container) return;

        container.innerHTML = '';
        container.classList.toggle('array-size-small', this.arraySize <= 25);

        this.array.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.className = 'array-bar';
            bar.style.height = `${value}%`;
            bar.setAttribute('data-index', index);

            const label = document.createElement('span');
            label.className = 'bar-value';
            label.textContent = value;
            bar.appendChild(label);

            container.appendChild(bar);
        });
    }

    updateBarHeight(index, value) {
        const bar = document.querySelector(`[data-index="${index}"]`);
        if (bar) {
            bar.style.height = `${value}%`;
            const label = bar.querySelector('.bar-value');
            if (label) label.textContent = value;
        }
    }

    updateBarLabels() {
        const container = document.getElementById('array-container');
        if (container) {
            container.classList.toggle('array-size-small', this.arraySize <= 25);
        }
    }

    updateAlgorithmInfo() {
        const algo = this.algorithms[this.currentAlgorithm];
        if (!algo) return;

        const currentAlgoEl = document.getElementById('current-algorithm');
        const descEl = document.getElementById('algorithm-description');
        const bestCaseEl = document.getElementById('best-case');
        const avgCaseEl = document.getElementById('average-case');
        const worstCaseEl = document.getElementById('worst-case');
        const spaceComplexityEl = document.getElementById('space-complexity');

        if (currentAlgoEl) currentAlgoEl.textContent = algo.name;
        if (descEl) descEl.textContent = algo.description;
        if (bestCaseEl) bestCaseEl.textContent = algo.timeComplexity.best;
        if (avgCaseEl) avgCaseEl.textContent = algo.timeComplexity.average;
        if (worstCaseEl) worstCaseEl.textContent = algo.timeComplexity.worst;
        if (spaceComplexityEl) spaceComplexityEl.textContent = algo.spaceComplexity;
    }

    resetStatistics() {
        this.comparisons = 0;
        this.swaps = 0;
        this.arrayAccess = 0;
        this.elapsedTime = 0;
        this.stopTimer();
        this.updateStatistics();
        this.updateProgress(0);
    }

    updateStatistics() {
        const comparisonsEl = document.getElementById('comparisons');
        const swapsEl = document.getElementById('swaps');
        const arrayAccessEl = document.getElementById('array-access');
        const timeElapsedEl = document.getElementById('time-elapsed');

        if (comparisonsEl) comparisonsEl.textContent = this.comparisons.toLocaleString();
        if (swapsEl) swapsEl.textContent = this.swaps.toLocaleString();
        if (arrayAccessEl) arrayAccessEl.textContent = this.arrayAccess.toLocaleString();
        if (timeElapsedEl) timeElapsedEl.textContent = `${this.elapsedTime}ms`;
    }

    updateProgress(percentage) {
        const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
        const fill = document.getElementById('progress-fill');
        const text = document.getElementById('progress-text');
        if (fill) fill.style.width = `${clamped}%`;
        if (text) text.textContent = `${clamped}%`;
    }

    setStatus(text, state = 'ready') {
        const statusText = document.getElementById('status-text');
        const indicator = document.getElementById('status-indicator');
        if (statusText) statusText.textContent = text;
        if (indicator) {
            indicator.className = 'status-indicator';
            if (state === 'sorting') indicator.classList.add('sorting');
            if (state === 'sorted') indicator.classList.add('sorted');
        }
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            if (this.isPlaying && !this.isPaused) {
                this.elapsedTime += 20;
                const timeElapsedEl = document.getElementById('time-elapsed');
                if (timeElapsedEl) timeElapsedEl.textContent = `${this.elapsedTime}ms`;
            }
        }, 20);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    getDelayTime() {
        // Natural exponential delay curve from speed 1 (slow) to 10 (ultra fast)
        const speeds = [380, 240, 150, 95, 60, 35, 18, 9, 4, 1];
        const idx = Math.min(Math.max(this.animationSpeed - 1, 0), 9);
        return speeds[idx];
    }

    async delay() {
        // Step execution mode
        if (this.isStepMode) {
            return new Promise((resolve, reject) => {
                this.stepResolve = resolve;
                this.cancelReject = reject;
            });
        }

        // Continuous playback with pause handling
        return new Promise((resolve, reject) => {
            this.cancelReject = reject;
            const check = () => {
                if (!this.isPlaying) {
                    reject(new Error('Animation stopped'));
                    return;
                }
                if (this.isPaused) {
                    this.timeoutId = setTimeout(check, 30);
                } else {
                    const delayTime = this.getDelayTime();
                    this.timeoutId = setTimeout(resolve, delayTime);
                }
            };
            check();
        });
    }

    async play() {
        if (this.isPaused) {
            this.isPaused = false;
            this.isStepMode = false;
            this.setStatus(`Resumed ${this.algorithms[this.currentAlgorithm].name}...`, 'sorting');
            this.updateControlButtons();
            return;
        }

        if (this.isPlaying) return;

        this.isPlaying = true;
        this.isPaused = false;
        this.isStepMode = false;
        this.startTimer();
        this.updateControlButtons();
        document.body.classList.add('sorting');
        this.setStatus(`Executing ${this.algorithms[this.currentAlgorithm].name}...`, 'sorting');

        try {
            await this.runAlgorithm();
            await this.markAllAsSorted();
            this.setStatus(`Complete! Array sorted in ${this.elapsedTime}ms with ${this.comparisons} comparisons.`, 'sorted');
        } catch (error) {
            if (error.message !== 'Animation stopped') {
                console.error('Sorting visualizer error:', error);
            }
        } finally {
            this.stopTimer();
            document.body.classList.remove('sorting');
            this.isPlaying = false;
            this.isPaused = false;
            this.isStepMode = false;
            this.updateControlButtons();
        }
    }

    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.isPaused = true;
            this.setStatus('Paused. Click Play to resume or Step to advance one action.');
            this.updateControlButtons();
        }
    }

    step() {
        if (!this.isPlaying) {
            // Start execution in step-mode
            this.isStepMode = true;
            this.play();
        } else if (this.isPaused || this.isStepMode) {
            // Trigger next step
            this.isPaused = true;
            this.isStepMode = true;
            if (this.stepResolve) {
                const resolve = this.stepResolve;
                this.stepResolve = null;
                resolve();
            }
        }
    }

    reset() {
        this.isPlaying = false;
        this.isPaused = false;
        this.isStepMode = false;

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        if (this.cancelReject) {
            this.cancelReject(new Error('Animation stopped'));
            this.cancelReject = null;
        }

        this.stepResolve = null;
        this.stopTimer();
        document.body.classList.remove('sorting');

        // Restore initial unsorted array state
        this.array = [...this.initialArray];
        this.renderArray();
        this.resetStatistics();
        this.setStatus('Reset to initial array. Ready to visualize.');
        this.updateControlButtons();
    }

    updateControlButtons() {
        const playBtn = document.getElementById('play-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stepBtn = document.getElementById('step-btn');
        const resetBtn = document.getElementById('reset-btn');
        const generateBtn = document.getElementById('generate-array');
        const playBtnText = document.getElementById('play-btn-text');

        if (!playBtn || !pauseBtn || !resetBtn) return;

        if (this.isPlaying && !this.isPaused && !this.isStepMode) {
            playBtn.disabled = true;
            pauseBtn.disabled = false;
            if (stepBtn) stepBtn.disabled = false;
            resetBtn.disabled = false;
            if (generateBtn) generateBtn.disabled = true;
            if (playBtnText) playBtnText.textContent = 'Running';
        } else if (this.isPaused || this.isStepMode) {
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            if (stepBtn) stepBtn.disabled = false;
            resetBtn.disabled = false;
            if (generateBtn) generateBtn.disabled = true;
            if (playBtnText) playBtnText.textContent = 'Resume';
        } else {
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            if (stepBtn) stepBtn.disabled = false;
            resetBtn.disabled = false;
            if (generateBtn) generateBtn.disabled = false;
            if (playBtnText) playBtnText.textContent = 'Play';
        }
    }

    clearBarClasses() {
        document.querySelectorAll('.array-bar').forEach(bar => {
            bar.classList.remove('comparing', 'swapping', 'pivot');
        });
    }

    async highlightBars(indices, className, updateStats = true) {
        this.clearBarClasses();

        indices.forEach(index => {
            if (index >= 0 && index < this.array.length) {
                const bar = document.querySelector(`[data-index="${index}"]`);
                if (bar) {
                    bar.classList.add(className);
                }
            }
        });

        // Trigger reactive audio
        if (indices.length > 0 && this.array[indices[0]] !== undefined) {
            this.sound.playTone(this.array[indices[0]], this.maxValue);
        }

        if (updateStats) {
            if (className === 'comparing') this.comparisons++;
            if (className === 'swapping') this.swaps++;
            this.arrayAccess += indices.length;
            this.updateStatistics();
        }

        await this.delay();
    }

    async swapElements(i, j) {
        [this.array[i], this.array[j]] = [this.array[j], this.array[i]];

        this.updateBarHeight(i, this.array[i]);
        this.updateBarHeight(j, this.array[j]);

        this.swaps++;
        this.arrayAccess += 2;
        this.updateStatistics();
        this.sound.playTone(this.array[i], this.maxValue, 'triangle');
    }

    async runAlgorithm() {
        switch (this.currentAlgorithm) {
            case 'bubble':
                await this.bubbleSort();
                break;
            case 'selection':
                await this.selectionSort();
                break;
            case 'insertion':
                await this.insertionSort();
                break;
            case 'merge':
                await this.mergeSort(0, this.array.length - 1);
                break;
            case 'quick':
                await this.quickSort(0, this.array.length - 1);
                break;
            case 'heap':
                await this.heapSort();
                break;
            case 'shell':
                await this.shellSort();
                break;
        }
    }

    // 1. Bubble Sort (Optimized with early break)
    async bubbleSort() {
        const n = this.array.length;
        for (let i = 0; i < n - 1; i++) {
            let swapped = false;
            for (let j = 0; j < n - i - 1; j++) {
                this.setStatus(`Bubble Sort: Comparing index ${j} and ${j + 1}`);
                await this.highlightBars([j, j + 1], 'comparing');

                if (this.array[j] > this.array[j + 1]) {
                    this.setStatus(`Bubble Sort: Swapping ${this.array[j]} & ${this.array[j + 1]}`);
                    await this.highlightBars([j, j + 1], 'swapping', false);
                    await this.swapElements(j, j + 1);
                    swapped = true;
                }
            }

            const sortedBar = document.querySelector(`[data-index="${n - 1 - i}"]`);
            if (sortedBar) sortedBar.classList.add('sorted');

            this.updateProgress(((i + 1) / n) * 100);
            if (!swapped) break;
        }
    }

    // 2. Selection Sort
    async selectionSort() {
        const n = this.array.length;
        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;
            this.setStatus(`Selection Sort: Searching minimum for position ${i}`);

            for (let j = i + 1; j < n; j++) {
                await this.highlightBars([minIdx, j], 'comparing');
                if (this.array[j] < this.array[minIdx]) {
                    minIdx = j;
                }
            }

            if (minIdx !== i) {
                this.setStatus(`Selection Sort: Placing minimum ${this.array[minIdx]} at position ${i}`);
                await this.highlightBars([i, minIdx], 'swapping', false);
                await this.swapElements(i, minIdx);
            }

            const sortedBar = document.querySelector(`[data-index="${i}"]`);
            if (sortedBar) sortedBar.classList.add('sorted');

            this.updateProgress(((i + 1) / n) * 100);
        }
    }

    // 3. Insertion Sort
    async insertionSort() {
        const n = this.array.length;
        const firstBar = document.querySelector(`[data-index="0"]`);
        if (firstBar) firstBar.classList.add('sorted');

        for (let i = 1; i < n; i++) {
            let j = i;
            this.setStatus(`Insertion Sort: Inserting element ${this.array[i]} into sorted sublist`);

            while (j > 0) {
                await this.highlightBars([j - 1, j], 'comparing');

                if (this.array[j - 1] > this.array[j]) {
                    await this.highlightBars([j - 1, j], 'swapping', false);
                    await this.swapElements(j - 1, j);
                    j--;
                } else {
                    break;
                }
            }

            for (let k = 0; k <= i; k++) {
                const bar = document.querySelector(`[data-index="${k}"]`);
                if (bar) bar.classList.add('sorted');
            }

            this.updateProgress((i / (n - 1)) * 100);
        }
    }

    // 4. Merge Sort
    async mergeSort(left, right) {
        if (left < right) {
            const mid = Math.floor((left + right) / 2);
            await this.mergeSort(left, mid);
            await this.mergeSort(mid + 1, right);
            await this.merge(left, mid, right);
        }
    }

    async merge(left, mid, right) {
        const leftArr = this.array.slice(left, mid + 1);
        const rightArr = this.array.slice(mid + 1, right + 1);
        this.setStatus(`Merge Sort: Merging range [${left}..${mid}] and [${mid + 1}..${right}]`);

        let i = 0, j = 0, k = left;

        while (i < leftArr.length && j < rightArr.length) {
            await this.highlightBars([left + i, mid + 1 + j], 'comparing');

            if (leftArr[i] <= rightArr[j]) {
                this.array[k] = leftArr[i];
                i++;
            } else {
                this.array[k] = rightArr[j];
                j++;
            }

            this.updateBarHeight(k, this.array[k]);
            this.swaps++;
            this.arrayAccess += 2;
            this.updateStatistics();
            await this.highlightBars([k], 'swapping', false);
            k++;
        }

        while (i < leftArr.length) {
            this.array[k] = leftArr[i];
            this.updateBarHeight(k, this.array[k]);
            this.swaps++;
            this.arrayAccess++;
            this.updateStatistics();
            await this.highlightBars([k], 'swapping', false);
            i++;
            k++;
        }

        while (j < rightArr.length) {
            this.array[k] = rightArr[j];
            this.updateBarHeight(k, this.array[k]);
            this.swaps++;
            this.arrayAccess++;
            this.updateStatistics();
            await this.highlightBars([k], 'swapping', false);
            j++;
            k++;
        }

        this.updateProgress(((right + 1) / this.array.length) * 100);
    }

    // 5. Quick Sort (Lomuto Partition with Pivot visual)
    async quickSort(low, high) {
        if (low < high) {
            const pi = await this.partition(low, high);
            await this.quickSort(low, pi - 1);
            await this.quickSort(pi + 1, high);
        } else if (low === high) {
            const bar = document.querySelector(`[data-index="${low}"]`);
            if (bar) bar.classList.add('sorted');
        }
    }

    async partition(low, high) {
        const pivot = this.array[high];
        let i = low - 1;

        this.setStatus(`Quick Sort: Selected pivot ${pivot} at index ${high}`);
        await this.highlightBars([high], 'pivot', false);

        for (let j = low; j < high; j++) {
            await this.highlightBars([j, high], 'comparing');

            if (this.array[j] < pivot) {
                i++;
                if (i !== j) {
                    await this.highlightBars([i, j], 'swapping', false);
                    await this.swapElements(i, j);
                }
            }
        }

        if (i + 1 !== high) {
            await this.highlightBars([i + 1, high], 'swapping', false);
            await this.swapElements(i + 1, high);
        }

        const pivotBar = document.querySelector(`[data-index="${i + 1}"]`);
        if (pivotBar) pivotBar.classList.add('sorted');

        this.updateProgress(((i + 1) / this.array.length) * 100);
        return i + 1;
    }

    // 6. Heap Sort
    async heapSort() {
        const n = this.array.length;

        // Build Max Heap
        this.setStatus('Heap Sort: Building max-heap structure');
        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
            await this.heapify(n, i);
        }

        // Extract elements from heap one by one
        for (let i = n - 1; i > 0; i--) {
            this.setStatus(`Heap Sort: Moving max element to position ${i}`);
            await this.highlightBars([0, i], 'swapping', false);
            await this.swapElements(0, i);

            const sortedBar = document.querySelector(`[data-index="${i}"]`);
            if (sortedBar) sortedBar.classList.add('sorted');

            await this.heapify(i, 0);
            this.updateProgress(((n - i) / n) * 100);
        }

        const rootBar = document.querySelector(`[data-index="0"]`);
        if (rootBar) rootBar.classList.add('sorted');
    }

    async heapify(n, i) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < n) {
            await this.highlightBars([left, largest], 'comparing');
            if (this.array[left] > this.array[largest]) {
                largest = left;
            }
        }

        if (right < n) {
            await this.highlightBars([right, largest], 'comparing');
            if (this.array[right] > this.array[largest]) {
                largest = right;
            }
        }

        if (largest !== i) {
            await this.highlightBars([i, largest], 'swapping', false);
            await this.swapElements(i, largest);
            await this.heapify(n, largest);
        }
    }

    // 7. Shell Sort
    async shellSort() {
        const n = this.array.length;

        for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
            this.setStatus(`Shell Sort: Sorting with gap interval ${gap}`);

            for (let i = gap; i < n; i++) {
                const temp = this.array[i];
                let j = i;

                await this.highlightBars([i, i - gap], 'comparing');

                while (j >= gap && this.array[j - gap] > temp) {
                    await this.highlightBars([j, j - gap], 'swapping', false);
                    this.array[j] = this.array[j - gap];
                    this.updateBarHeight(j, this.array[j]);
                    this.swaps++;
                    this.arrayAccess += 2;
                    this.updateStatistics();
                    j -= gap;

                    if (j >= gap) {
                        await this.highlightBars([j, j - gap], 'comparing');
                    }
                }

                this.array[j] = temp;
                this.updateBarHeight(j, temp);
                this.arrayAccess++;
                this.updateStatistics();
            }

            this.updateProgress((1 - gap / n) * 100);
        }
    }

    // Celebratory wave across all bars when completed
    async markAllAsSorted() {
        this.clearBarClasses();
        const n = this.array.length;
        const waveDelay = Math.max(8, Math.min(30, 600 / n));

        for (let i = 0; i < n; i++) {
            if (!this.isPlaying) return;
            const bar = document.querySelector(`[data-index="${i}"]`);
            if (bar) {
                bar.classList.add('sorted');
                this.sound.playTone(this.array[i], this.maxValue, 'sine');
            }
            await new Promise(r => setTimeout(r, waveDelay));
        }

        if (this.isPlaying) {
            this.updateProgress(100);
        }
    }
}

// Initialize when DOM content is ready
document.addEventListener('DOMContentLoaded', () => {
    window.sortingVisualizer = new SortingVisualizer();
});