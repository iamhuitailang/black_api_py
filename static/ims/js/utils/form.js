const FormUtil = {
    validate(form, rules) {
        let isValid = true;
        const errors = {};
        
        for (const [field, fieldRules] of Object.entries(rules)) {
            const input = form.querySelector(`[name="${field}"]`);
            if (!input) continue;
            
            const value = input.value.trim();
            const fieldErrors = [];
            
            for (const rule of fieldRules) {
                if (rule.required && !value) {
                    fieldErrors.push(rule.message || '此字段为必填项');
                    continue;
                }
                
                if (rule.minLength && value.length < rule.minLength) {
                    fieldErrors.push(rule.message || `最少需要 ${rule.minLength} 个字符`);
                    continue;
                }
                
                if (rule.maxLength && value.length > rule.maxLength) {
                    fieldErrors.push(rule.message || `最多允许 ${rule.maxLength} 个字符`);
                    continue;
                }
                
                if (rule.pattern && !rule.pattern.test(value)) {
                    fieldErrors.push(rule.message || '格式不正确');
                    continue;
                }
                
                if (rule.min !== undefined && parseFloat(value) < rule.min) {
                    fieldErrors.push(rule.message || `最小值为 ${rule.min}`);
                    continue;
                }
                
                if (rule.max !== undefined && parseFloat(value) > rule.max) {
                    fieldErrors.push(rule.message || `最大值为 ${rule.max}`);
                    continue;
                }
            }
            
            if (fieldErrors.length > 0) {
                isValid = false;
                errors[field] = fieldErrors[0];
                this.setError(input, fieldErrors[0]);
            } else {
                this.clearError(input);
            }
        }
        
        return { isValid, errors };
    },
    
    setError(input, message) {
        input.classList.add('error');
        
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            let errorEl = formGroup.querySelector('.form-error');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'form-error';
                formGroup.appendChild(errorEl);
            }
            errorEl.textContent = message;
        }
    },
    
    clearError(input) {
        input.classList.remove('error');
        
        const formGroup = input.closest('.form-group');
        if (formGroup) {
            const errorEl = formGroup.querySelector('.form-error');
            if (errorEl) {
                errorEl.remove();
            }
        }
    },
    
    clearAllErrors(form) {
        form.querySelectorAll('.form-control').forEach(input => {
            this.clearError(input);
        });
    },
    
    getData(form) {
        const data = {};
        const formData = new FormData(form);
        
        for (const [key, value] of formData.entries()) {
            if (value !== '') {
                data[key] = value;
            }
        }
        
        return data;
    },
    
    setData(form, data) {
        for (const [key, value] of Object.entries(data)) {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = !!value;
                } else if (input.tagName === 'SELECT' || input.type === 'select-one') {
                    input.value = value || '';
                } else {
                    input.value = value !== null && value !== undefined ? value : '';
                }
            }
        }
    },
    
    reset(form) {
        form.reset();
        this.clearAllErrors(form);
    },
    
    setLoading(button, loading, text = '提交中...') {
        if (loading) {
            button.disabled = true;
            button.classList.add('btn-loading');
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = `<span class="loading"></span> ${text}`;
        } else {
            button.disabled = false;
            button.classList.remove('btn-loading');
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }
};
