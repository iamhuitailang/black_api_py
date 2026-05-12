const Calculator = {
    calculateWeight(weight, unit) {
        if (unit === 'g') {
            return weight / 1000;
        }
        return weight;
    },

    calculateVolumeWeight(length, width, height, ratio = 6000) {
        if (!length || !width || !height) {
            return 0;
        }
        return (length * width * height) / ratio;
    },

    calculateByWeight(company, weightKg) {
        if (weightKg <= company.firstWeight) {
            return company.basePrice;
        }
        const continueWeight = Math.ceil(weightKg - company.firstWeight);
        return company.basePrice + continueWeight * company.continuePrice;
    },

    calculateByVolume(company, volumeWeightKg) {
        return this.calculateByWeight(company, volumeWeightKg);
    },

    calculateByPiece(company) {
        return company.piecePrice;
    },

    determineBillingType(weightKg, volumeWeightKg, userSelection) {
        if (userSelection !== 'auto') {
            return userSelection;
        }
        
        if (volumeWeightKg > 0 && volumeWeightKg > weightKg) {
            return 'volume';
        }
        
        if (weightKg < 0.5) {
            return 'piece';
        }
        
        return 'weight';
    },

    calculate(company, params) {
        const weightKg = this.calculateWeight(params.weight, params.weightUnit);
        const volumeWeightKg = this.calculateVolumeWeight(
            params.length,
            params.width,
            params.height,
            company.volumeRatio
        );
        
        const billingType = this.determineBillingType(weightKg, volumeWeightKg, params.billingType);
        
        let basePrice = 0;
        let calculatedWeight = 0;
        
        switch (billingType) {
            case 'volume':
                basePrice = this.calculateByVolume(company, volumeWeightKg);
                calculatedWeight = volumeWeightKg;
                break;
            case 'piece':
                basePrice = this.calculateByPiece(company);
                calculatedWeight = weightKg;
                break;
            case 'weight':
            default:
                basePrice = this.calculateByWeight(company, weightKg);
                calculatedWeight = weightKg;
        }
        
        const zoneMultiplier = RegionData.getZoneMultiplier(
            params.senderProvince,
            params.receiverProvince,
            params.senderCity,
            params.receiverCity
        );
        
        const zonePrice = basePrice * zoneMultiplier;
        const finalPrice = zonePrice * company.discount;
        
        return {
            company: company,
            basePrice: basePrice.toFixed(2),
            zoneMultiplier: zoneMultiplier,
            zonePrice: zonePrice.toFixed(2),
            discount: company.discount,
            discountText: company.discountText,
            finalPrice: finalPrice.toFixed(2),
            billingType: billingType,
            weightKg: weightKg,
            volumeWeightKg: volumeWeightKg,
            calculatedWeight: calculatedWeight,
            deliveryTime: company.deliveryTime
        };
    },

    calculateAll(params) {
        const companies = ExpressCompanies.getAll();
        const results = companies.map(company => this.calculate(company, params));
        
        results.sort((a, b) => parseFloat(a.finalPrice) - parseFloat(b.finalPrice));
        
        return results;
    },

    getBillingTypeName(type) {
        const names = {
            weight: '按重量计费',
            volume: '体积重计费',
            piece: '按件计费'
        };
        return names[type] || '未知';
    }
};