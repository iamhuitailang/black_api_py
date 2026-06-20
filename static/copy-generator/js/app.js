const { createApp, ref, computed, watch, onMounted } = Vue;

const STORAGE_TEMPLATE_KEY = 'copyTemplates';
const STORAGE_VARPOOLS_KEY = 'copyVarPools';
const PAGE_SIZE_THRESHOLD = 500;
const DEFAULT_PAGE_SIZE = 100;

createApp({
    setup() {
        const template = ref('');
        const varPools = ref([]);
        const newVarName = ref('');
        const combinations = ref([]);
        const currentPage = ref(1);
        const pageSize = ref(DEFAULT_PAGE_SIZE);
        const selectAll = ref(false);

        const variableNames = computed(() => {
            const regex = /\{\{([^{}]+)\}\}/g;
            const names = new Set();
            let match;
            while ((match = regex.exec(template.value)) !== null) {
                names.add(match[1].trim());
            }
            return Array.from(names);
        });

        const totalCombinations = computed(() => {
            if (varPools.value.length === 0) return 0;
            let total = 1;
            for (const v of varPools.value) {
                if (v.values.length === 0) return 0;
                total *= v.values.length;
            }
            return total;
        });

        const canGenerate = computed(() => {
            return template.value.trim() !== '' 
                && varPools.value.length > 0 
                && totalCombinations.value > 0;
        });

        const totalPages = computed(() => {
            if (combinations.value.length === 0) return 1;
            return Math.ceil(combinations.value.length / pageSize.value);
        });

        const paginatedCombinations = computed(() => {
            const start = (currentPage.value - 1) * pageSize.value;
            const end = start + pageSize.value;
            return combinations.value.slice(start, end);
        });

        const selectedCount = computed(() => {
            return combinations.value.filter(c => c.selected).length;
        });

        const selectedCombinations = computed(() => {
            return combinations.value.filter(c => c.selected);
        });

        function parseRawText(rawText) {
            return rawText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line !== '');
        }

        function onTemplateChange() {
            saveToStorage();
        }

        function extractVariables() {
            const names = variableNames.value;
            const existingNames = new Set(varPools.value.map(v => v.name));
            
            for (const name of names) {
                if (!existingNames.has(name)) {
                    varPools.value.push({
                        name: name,
                        rawText: '',
                        values: []
                    });
                }
            }

            varPools.value = varPools.value.filter(v => names.includes(v.name));
            saveToStorage();
        }

        function addVariable() {
            const name = newVarName.value.trim();
            if (!name) return;
            
            const exists = varPools.value.some(v => v.name === name);
            if (exists) {
                newVarName.value = '';
                return;
            }

            varPools.value.push({
                name: name,
                rawText: '',
                values: []
            });
            newVarName.value = '';
            saveToStorage();
        }

        function removeVariable(index) {
            varPools.value.splice(index, 1);
            saveToStorage();
        }

        function onVarValuesChange(v) {
            v.values = parseRawText(v.rawText);
            saveToStorage();
        }

        function generateCombinations() {
            if (!canGenerate.value) return;

            const vars = varPools.value;
            const varNames = vars.map(v => v.name);
            const varValues = vars.map(v => v.values);

            const result = [];
            
            function cartesian(index, current) {
                if (index === varNames.length) {
                    const varsObj = {};
                    for (let i = 0; i < varNames.length; i++) {
                        varsObj[varNames[i]] = current[i];
                    }
                    
                    let text = template.value;
                    for (const name of varNames) {
                        const regex = new RegExp('\\{\\{' + escapeRegExp(name) + '\\}\\}', 'g');
                        text = text.replace(regex, varsObj[name]);
                    }

                    result.push({
                        id: result.length,
                        vars: varsObj,
                        text: text,
                        selected: true
                    });
                    return;
                }

                for (const val of varValues[index]) {
                    current.push(val);
                    cartesian(index + 1, current);
                    current.pop();
                }
            }

            cartesian(0, []);
            combinations.value = result;
            
            if (result.length > PAGE_SIZE_THRESHOLD) {
                pageSize.value = DEFAULT_PAGE_SIZE;
            } else {
                pageSize.value = result.length > 0 ? result.length : DEFAULT_PAGE_SIZE;
            }
            currentPage.value = 1;
            selectAll.value = true;
        }

        function escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function toggleSelectAll() {
            const start = (currentPage.value - 1) * pageSize.value;
            const end = Math.min(start + pageSize.value, combinations.value.length);
            
            for (let i = start; i < end; i++) {
                combinations.value[i].selected = selectAll.value;
            }
        }

        function deleteSelected() {
            combinations.value = combinations.value.filter(c => !c.selected);
            selectAll.value = false;
            
            if (currentPage.value > totalPages.value) {
                currentPage.value = totalPages.value;
            }
        }

        function exportJSON() {
            const selected = selectedCombinations.value.map(c => ({
                vars: c.vars,
                text: c.text
            }));
            
            const blob = new Blob([JSON.stringify(selected, null, 2)], { 
                type: 'application/json;charset=utf-8' 
            });
            downloadFile(blob, 'selected_copywriting.json');
        }

        function exportText() {
            const text = selectedCombinations.value.map(c => c.text).join('\n');
            const blob = new Blob([text], { 
                type: 'text/plain;charset=utf-8' 
            });
            downloadFile(blob, 'selected_copywriting.txt');
        }

        function downloadFile(blob, filename) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        function saveToStorage() {
            try {
                localStorage.setItem(STORAGE_TEMPLATE_KEY, template.value);
                
                const poolsData = varPools.value.map(v => ({
                    name: v.name,
                    values: v.values
                }));
                localStorage.setItem(STORAGE_VARPOOLS_KEY, JSON.stringify(poolsData));
            } catch (e) {
                console.warn('保存到localStorage失败:', e);
            }
        }

        function loadFromStorage() {
            try {
                const savedTemplate = localStorage.getItem(STORAGE_TEMPLATE_KEY);
                if (savedTemplate !== null) {
                    template.value = savedTemplate;
                }

                const savedPools = localStorage.getItem(STORAGE_VARPOOLS_KEY);
                if (savedPools) {
                    const poolsData = JSON.parse(savedPools);
                    varPools.value = poolsData.map(p => ({
                        name: p.name,
                        values: p.values || [],
                        rawText: (p.values || []).join('\n')
                    }));
                }
            } catch (e) {
                console.warn('从localStorage读取失败:', e);
            }
        }

        watch(template, () => {
            saveToStorage();
        });

        watch(varPools, () => {
            saveToStorage();
        }, { deep: true });

        onMounted(() => {
            loadFromStorage();
        });

        return {
            template,
            varPools,
            newVarName,
            combinations,
            currentPage,
            pageSize,
            selectAll,
            variableNames,
            totalCombinations,
            canGenerate,
            totalPages,
            paginatedCombinations,
            selectedCount,
            selectedCombinations,
            onTemplateChange,
            extractVariables,
            addVariable,
            removeVariable,
            onVarValuesChange,
            generateCombinations,
            toggleSelectAll,
            deleteSelected,
            exportJSON,
            exportText
        };
    }
}).mount('#app');
