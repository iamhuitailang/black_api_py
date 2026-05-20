const MBTIScoring = (function() {
    function calculateScores(answers) {
        const scores = {
            EI: 0,
            SN: 0,
            TF: 0,
            JP: 0
        };

        MBTIData.questions.forEach(question => {
            const answerIndex = answers[question.id];
            if (answerIndex !== undefined) {
                const option = question.options[answerIndex];
                if (option) {
                    scores[question.dimension] += option.score;
                }
            }
        });

        return scores;
    }

    function getDimensionResult(dimension, score) {
        const dim = MBTIData.dimensions[dimension];
        let type, percentage;

        if (score > 0) {
            type = dim.left;
            percentage = Math.min(100, Math.round(score / 6 * 50 + 50));
        } else if (score < 0) {
            type = dim.right;
            percentage = Math.min(100, Math.round(Math.abs(score) / 6 * 50 + 50));
        } else {
            type = null;
            percentage = 50;
        }

        return {
            type,
            score,
            percentage,
            left: dim.left,
            leftName: dim.leftName,
            right: dim.right,
            rightName: dim.rightName
        };
    }

    function calculateResult(answers) {
        const scores = calculateScores(answers);
        const dimensions = {
            EI: getDimensionResult('EI', scores.EI),
            SN: getDimensionResult('SN', scores.SN),
            TF: getDimensionResult('TF', scores.TF),
            JP: getDimensionResult('JP', scores.JP)
        };

        let typeCode = '';
        typeCode += dimensions.EI.type || 'X';
        typeCode += dimensions.SN.type || 'X';
        typeCode += dimensions.TF.type || 'X';
        typeCode += dimensions.JP.type || 'X';

        const typeInfo = MBTIData.types[typeCode] || null;

        return {
            typeCode,
            typeInfo,
            dimensions,
            scores,
            totalQuestions: Object.keys(answers).length
        };
    }

    function getProgress(answers) {
        const answered = Object.keys(answers).length;
        const total = MBTIData.questions.length;
        return {
            answered,
            total,
            percentage: Math.round((answered / total) * 100)
        };
    }

    function canSubmit(answers) {
        const progress = getProgress(answers);
        return progress.answered === progress.total;
    }

    function compareHistory(history) {
        if (history.length < 2) return [];
        
        const comparisons = [];
        for (let i = 1; i < history.length; i++) {
            const prev = history[i];
            const curr = history[i - 1];
            
            const changes = [];
            ['EI', 'SN', 'TF', 'JP'].forEach(dim => {
                const prevType = prev.dimensions[dim].type;
                const currType = curr.dimensions[dim].type;
                if (prevType !== currType) {
                    changes.push({
                        dimension: dim,
                        from: prevType,
                        to: currType,
                        fromScore: prev.dimensions[dim].score,
                        toScore: curr.dimensions[dim].score
                    });
                }
            });

            comparisons.push({
                from: prev,
                to: curr,
                changes
            });
        }
        
        return comparisons;
    }

    return {
        calculateScores,
        calculateResult,
        getDimensionResult,
        getProgress,
        canSubmit,
        compareHistory
    };
})();
