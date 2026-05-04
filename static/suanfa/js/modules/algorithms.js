/**
 * 排序算法模块 - 实现6种经典排序算法
 * Sorting Algorithms Module - Implements 6 classic sorting algorithms
 * 
 * 每种算法都是生成器函数，yield出每一步的动画状态
 * Each algorithm is a generator function, yielding animation states at each step
 */

const AlgorithmType = {
    BUBBLE: 'bubble',
    SELECTION: 'selection',
    INSERTION: 'insertion',
    QUICK: 'quick',
    MERGE: 'merge',
    HEAP: 'heap'
};

const AlgorithmInfo = {
    [AlgorithmType.BUBBLE]: {
        name: '冒泡排序',
        icon: '🫧',
        complexity: 'O(n²)',
        stable: true,
        description: '相邻比较，逐步冒泡'
    },
    [AlgorithmType.SELECTION]: {
        name: '选择排序',
        icon: '🎯',
        complexity: 'O(n²)',
        stable: false,
        description: '每次选最小/最大'
    },
    [AlgorithmType.INSERTION]: {
        name: '插入排序',
        icon: '📥',
        complexity: 'O(n²)',
        stable: true,
        description: '逐步插入有序区'
    },
    [AlgorithmType.QUICK]: {
        name: '快速排序',
        icon: '⚡',
        complexity: 'O(n log n)',
        stable: false,
        description: '分治 + 基准值'
    },
    [AlgorithmType.MERGE]: {
        name: '归并排序',
        icon: '🔗',
        complexity: 'O(n log n)',
        stable: true,
        description: '分治 + 合并'
    },
    [AlgorithmType.HEAP]: {
        name: '堆排序',
        icon: '🌲',
        complexity: 'O(n log n)',
        stable: false,
        description: '堆结构'
    }
};

function createAnimationStep(type, data = {}) {
    return {
        type,
        array: data.array || null,
        comparing: data.comparing || [],
        sorted: data.sorted || [],
        pivot: data.pivot || [],
        swapping: data.swapping || [],
        message: data.message || ''
    };
}

function* bubbleSort(array) {
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];

    for (let i = 0; i < n - 1; i++) {
        let swapped = false;

        for (let j = 0; j < n - i - 1; j++) {
            yield createAnimationStep('compare', {
                array: [...arr],
                comparing: [j, j + 1],
                sorted: [...sortedIndices],
                message: `比较 arr[${j}]=${arr[j]} 和 arr[${j + 1}]=${arr[j + 1]}`
            });

            if (arr[j] > arr[j + 1]) {
                yield createAnimationStep('swap', {
                    array: [...arr],
                    swapping: [j, j + 1],
                    sorted: [...sortedIndices],
                    message: `交换 arr[${j}]=${arr[j]} 和 arr[${j + 1}]=${arr[j + 1]}`
                });

                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swapped = true;

                yield createAnimationStep('after-swap', {
                    array: [...arr],
                    comparing: [j, j + 1],
                    sorted: [...sortedIndices],
                    message: `交换完成`
                });
            }
        }

        sortedIndices.unshift(n - i - 1);

        yield createAnimationStep('sorted', {
            array: [...arr],
            sorted: [...sortedIndices],
            message: `第 ${i + 1} 轮完成，索引 ${n - i - 1} 已归位`
        });

        if (!swapped) {
            for (let k = 0; k < n - i - 1; k++) {
                sortedIndices.unshift(k);
            }
            yield createAnimationStep('complete', {
                array: [...arr],
                sorted: Array.from({ length: n }, (_, idx) => idx),
                message: '数组已有序，提前完成!'
            });
            return arr;
        }
    }

    sortedIndices.unshift(0);
    yield createAnimationStep('complete', {
        array: [...arr],
        sorted: Array.from({ length: n }, (_, idx) => idx),
        message: '冒泡排序完成!'
    });

    return arr;
}

function* selectionSort(array) {
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];

    for (let i = 0; i < n - 1; i++) {
        let minIndex = i;

        yield createAnimationStep('pivot', {
            array: [...arr],
            pivot: [minIndex],
            sorted: [...sortedIndices],
            message: `假设索引 ${i}=${arr[i]} 为最小值`
        });

        for (let j = i + 1; j < n; j++) {
            yield createAnimationStep('compare', {
                array: [...arr],
                comparing: [minIndex, j],
                pivot: [minIndex],
                sorted: [...sortedIndices],
                message: `比较 arr[${minIndex}]=${arr[minIndex]} 和 arr[${j}]=${arr[j]}`
            });

            if (arr[j] < arr[minIndex]) {
                minIndex = j;

                yield createAnimationStep('pivot', {
                    array: [...arr],
                    pivot: [minIndex],
                    comparing: [j],
                    sorted: [...sortedIndices],
                    message: `找到更小值，更新最小值索引为 ${minIndex}=${arr[minIndex]}`
                });
            }
        }

        if (minIndex !== i) {
            yield createAnimationStep('swap', {
                array: [...arr],
                swapping: [i, minIndex],
                sorted: [...sortedIndices],
                message: `交换 arr[${i}]=${arr[i]} 和 arr[${minIndex}]=${arr[minIndex]}`
            });

            [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];

            yield createAnimationStep('after-swap', {
                array: [...arr],
                sorted: [...sortedIndices, i],
                message: `交换完成`
            });
        }

        sortedIndices.push(i);

        yield createAnimationStep('sorted', {
            array: [...arr],
            sorted: [...sortedIndices],
            message: `索引 ${i} 已归位`
        });
    }

    sortedIndices.push(n - 1);
    yield createAnimationStep('complete', {
        array: [...arr],
        sorted: Array.from({ length: n }, (_, idx) => idx),
        message: '选择排序完成!'
    });

    return arr;
}

function* insertionSort(array) {
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [0];

    for (let i = 1; i < n; i++) {
        const current = arr[i];
        let j = i - 1;

        yield createAnimationStep('pivot', {
            array: [...arr],
            pivot: [i],
            sorted: [...sortedIndices],
            message: `取出 arr[${i}]=${current}，准备插入有序区`
        });

        while (j >= 0 && arr[j] > current) {
            yield createAnimationStep('compare', {
                array: [...arr],
                comparing: [j, j + 1],
                pivot: [i],
                sorted: [...sortedIndices],
                message: `比较 arr[${j}]=${arr[j]} > ${current}，需要后移`
            });

            yield createAnimationStep('swap', {
                array: [...arr],
                swapping: [j, j + 1],
                pivot: [i],
                sorted: [...sortedIndices],
                message: `将 arr[${j}]=${arr[j]} 后移到 ${j + 1}`
            });

            arr[j + 1] = arr[j];
            j--;

            yield createAnimationStep('after-swap', {
                array: [...arr],
                pivot: [j + 1],
                sorted: [...sortedIndices],
                message: `后移完成`
            });
        }

        arr[j + 1] = current;

        sortedIndices.length = 0;
        for (let k = 0; k <= i; k++) {
            sortedIndices.push(k);
        }

        yield createAnimationStep('sorted', {
            array: [...arr],
            sorted: [...sortedIndices],
            message: `将 ${current} 插入正确位置 ${j + 1}`
        });
    }

    yield createAnimationStep('complete', {
        array: [...arr],
        sorted: Array.from({ length: n }, (_, idx) => idx),
        message: '插入排序完成!'
    });

    return arr;
}

function* quickSort(array) {
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];

    function* partition(low, high) {
        const pivot = arr[high];
        let i = low - 1;

        yield createAnimationStep('pivot', {
            array: [...arr],
            pivot: [high],
            sorted: [...sortedIndices],
            message: `选择基准值 pivot = ${pivot} (索引 ${high})`
        });

        for (let j = low; j < high; j++) {
            yield createAnimationStep('compare', {
                array: [...arr],
                comparing: [j, high],
                pivot: [high],
                sorted: [...sortedIndices],
                message: `比较 arr[${j}]=${arr[j]} <= ${pivot}?`
            });

            if (arr[j] <= pivot) {
                i++;
                if (i !== j) {
                    yield createAnimationStep('swap', {
                        array: [...arr],
                        swapping: [i, j],
                        pivot: [high],
                        sorted: [...sortedIndices],
                        message: `交换 arr[${i}]=${arr[i]} 和 arr[${j}]=${arr[j]}`
                    });

                    [arr[i], arr[j]] = [arr[j], arr[i]];

                    yield createAnimationStep('after-swap', {
                        array: [...arr],
                        pivot: [high],
                        sorted: [...sortedIndices],
                        message: `交换完成`
                    });
                }
            }
        }

        if (i + 1 !== high) {
            yield createAnimationStep('swap', {
                array: [...arr],
                swapping: [i + 1, high],
                sorted: [...sortedIndices],
                message: `将基准值 ${pivot} 移到正确位置 ${i + 1}`
            });

            [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];

            yield createAnimationStep('after-swap', {
                array: [...arr],
                sorted: [...sortedIndices],
                message: `基准值归位`
            });
        }

        const pivotIndex = i + 1;
        sortedIndices.push(pivotIndex);

        yield createAnimationStep('sorted', {
            array: [...arr],
            sorted: [...sortedIndices],
            pivot: [pivotIndex],
            message: `基准值 ${pivot} 已归位到索引 ${pivotIndex}`
        });

        return pivotIndex;
    }

    function* quickSortHelper(low, high) {
        if (low < high) {
            const pi = yield* partition(low, high);
            yield* quickSortHelper(low, pi - 1);
            yield* quickSortHelper(pi + 1, high);
        } else if (low === high && !sortedIndices.includes(low)) {
            sortedIndices.push(low);
            yield createAnimationStep('sorted', {
                array: [...arr],
                sorted: [...sortedIndices],
                message: `单元素区间 ${low} 已归位`
            });
        }
    }

    yield* quickSortHelper(0, n - 1);

    yield createAnimationStep('complete', {
        array: [...arr],
        sorted: Array.from({ length: n }, (_, idx) => idx),
        message: '快速排序完成!'
    });

    return arr;
}

function* mergeSort(array) {
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];

    function* merge(left, mid, right) {
        const leftArr = arr.slice(left, mid + 1);
        const rightArr = arr.slice(mid + 1, right + 1);

        let i = 0, j = 0, k = left;

        yield createAnimationStep('pivot', {
            array: [...arr],
            pivot: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
            sorted: [...sortedIndices],
            message: `合并区间 [${left}, ${mid}] 和 [${mid + 1}, ${right}]`
        });

        while (i < leftArr.length && j < rightArr.length) {
            yield createAnimationStep('compare', {
                array: [...arr],
                comparing: [left + i, mid + 1 + j],
                pivot: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
                sorted: [...sortedIndices],
                message: `比较 ${leftArr[i]} 和 ${rightArr[j]}`
            });

            if (leftArr[i] <= rightArr[j]) {
                arr[k] = leftArr[i];
                i++;
            } else {
                arr[k] = rightArr[j];
                j++;
            }

            yield createAnimationStep('swap', {
                array: [...arr],
                swapping: [k],
                pivot: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
                sorted: [...sortedIndices],
                message: `放置 arr[${k}] = ${arr[k]}`
            });

            k++;
        }

        while (i < leftArr.length) {
            arr[k] = leftArr[i];
            yield createAnimationStep('swap', {
                array: [...arr],
                swapping: [k],
                sorted: [...sortedIndices],
                message: `复制剩余左元素 arr[${k}] = ${arr[k]}`
            });
            i++;
            k++;
        }

        while (j < rightArr.length) {
            arr[k] = rightArr[j];
            yield createAnimationStep('swap', {
                array: [...arr],
                swapping: [k],
                sorted: [...sortedIndices],
                message: `复制剩余右元素 arr[${k}] = ${arr[k]}`
            });
            j++;
            k++;
        }

        yield createAnimationStep('after-swap', {
            array: [...arr],
            sorted: [...sortedIndices],
            message: `合并完成`
        });
    }

    function* mergeSortHelper(left, right) {
        if (left < right) {
            const mid = Math.floor((left + right) / 2);
            yield* mergeSortHelper(left, mid);
            yield* mergeSortHelper(mid + 1, right);
            yield* merge(left, mid, right);
        }
    }

    yield* mergeSortHelper(0, n - 1);

    yield createAnimationStep('complete', {
        array: [...arr],
        sorted: Array.from({ length: n }, (_, idx) => idx),
        message: '归并排序完成!'
    });

    return arr;
}

function* heapSort(array) {
    const arr = [...array];
    const n = arr.length;
    const sortedIndices = [];

    function* heapify(size, root) {
        let largest = root;
        const left = 2 * root + 1;
        const right = 2 * root + 2;

        yield createAnimationStep('pivot', {
            array: [...arr],
            pivot: [root],
            sorted: [...sortedIndices],
            message: `堆化根节点 ${root}=${arr[root]}`
        });

        if (left < size) {
            yield createAnimationStep('compare', {
                array: [...arr],
                comparing: [largest, left],
                pivot: [root],
                sorted: [...sortedIndices],
                message: `比较左子节点 ${left}=${arr[left]}`
            });

            if (arr[left] > arr[largest]) {
                largest = left;
            }
        }

        if (right < size) {
            yield createAnimationStep('compare', {
                array: [...arr],
                comparing: [largest, right],
                pivot: [root],
                sorted: [...sortedIndices],
                message: `比较右子节点 ${right}=${arr[right]}`
            });

            if (arr[right] > arr[largest]) {
                largest = right;
            }
        }

        if (largest !== root) {
            yield createAnimationStep('swap', {
                array: [...arr],
                swapping: [root, largest],
                sorted: [...sortedIndices],
                message: `交换 ${root}=${arr[root]} 和 ${largest}=${arr[largest]}`
            });

            [arr[root], arr[largest]] = [arr[largest], arr[root]];

            yield createAnimationStep('after-swap', {
                array: [...arr],
                sorted: [...sortedIndices],
                message: `交换完成`
            });

            yield* heapify(size, largest);
        }
    }

    yield createAnimationStep('pivot', {
        array: [...arr],
        sorted: [...sortedIndices],
        message: '开始构建最大堆...'
    });

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        yield* heapify(n, i);
    }

    yield createAnimationStep('sorted', {
        array: [...arr],
        sorted: [...sortedIndices],
        message: '最大堆构建完成，开始提取元素'
    });

    for (let i = n - 1; i > 0; i--) {
        yield createAnimationStep('swap', {
            array: [...arr],
            swapping: [0, i],
            sorted: [...sortedIndices],
            message: `交换根节点 ${arr[0]} 和最后元素 ${arr[i]}`
        });

        [arr[0], arr[i]] = [arr[i], arr[0]];

        sortedIndices.unshift(i);

        yield createAnimationStep('sorted', {
            array: [...arr],
            sorted: [...sortedIndices],
            message: `元素 ${arr[i]} 已归位到索引 ${i}`
        });

        yield* heapify(i, 0);
    }

    sortedIndices.unshift(0);

    yield createAnimationStep('complete', {
        array: [...arr],
        sorted: Array.from({ length: n }, (_, idx) => idx),
        message: '堆排序完成!'
    });

    return arr;
}

const AlgorithmFunctions = {
    [AlgorithmType.BUBBLE]: bubbleSort,
    [AlgorithmType.SELECTION]: selectionSort,
    [AlgorithmType.INSERTION]: insertionSort,
    [AlgorithmType.QUICK]: quickSort,
    [AlgorithmType.MERGE]: mergeSort,
    [AlgorithmType.HEAP]: heapSort
};

export const AlgorithmsModule = {
    AlgorithmType,
    AlgorithmInfo,

    getAlgorithm(type) {
        return AlgorithmFunctions[type] || bubbleSort;
    },

    getAlgorithmInfo(type) {
        return AlgorithmInfo[type] || AlgorithmInfo[AlgorithmType.BUBBLE];
    },

    getAllAlgorithms() {
        return Object.entries(AlgorithmInfo).map(([type, info]) => ({
            type,
            ...info
        }));
    },

    createGenerator(type, array) {
        const algorithm = this.getAlgorithm(type);
        return algorithm(array);
    }
};

export default AlgorithmsModule;