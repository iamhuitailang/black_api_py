const GameService = {
    block: {
        async place(dreamId, x, y, z, blockType, color = '#ffffff', properties = null) {
            return await ApiService.post('/meng/block/place', {
                dream_id: dreamId,
                x,
                y,
                z,
                block_type: blockType,
                color,
                properties
            });
        },

        async batchPlace(dreamId, blocks) {
            return await ApiService.post('/meng/block/batch/place', {
                dream_id: dreamId,
                blocks
            });
        },

        async remove(dreamId, blockId) {
            return await ApiService.post(`/meng/block/remove?dream_id=${dreamId}&block_id=${blockId}`);
        },

        async batchRemove(dreamId, blockIds) {
            return await ApiService.post('/meng/block/batch/remove', {
                dream_id: dreamId,
                block_ids: blockIds
            });
        },

        async list(dreamId) {
            return await ApiService.get('/meng/block/list', {
                dream_id: dreamId
            });
        },

        async update(dreamId, blockId, data = {}) {
            return await ApiService.post('/meng/block/update', {
                dream_id: dreamId,
                block_id: blockId,
                ...data
            });
        },

        async clear(dreamId) {
            return await ApiService.post(`/meng/block/clear?dream_id=${dreamId}`);
        }
    },

    creature: {
        async create(dreamId, name, creatureType, x, y, z, behavior = null, script = null, properties = null) {
            return await ApiService.post('/meng/creature/create', {
                dream_id: dreamId,
                name,
                creature_type: creatureType,
                x,
                y,
                z,
                behavior,
                script,
                properties
            });
        },

        async batchCreate(dreamId, creatures) {
            return await ApiService.post('/meng/creature/batch/create', {
                dream_id: dreamId,
                creatures
            });
        },

        async list(dreamId) {
            return await ApiService.get('/meng/creature/list', {
                dream_id: dreamId
            });
        },

        async detail(creatureId) {
            return await ApiService.get('/meng/creature/detail', {
                creature_id: creatureId
            });
        },

        async update(dreamId, creatureId, data = {}) {
            return await ApiService.post('/meng/creature/update', {
                dream_id: dreamId,
                creature_id: creatureId,
                ...data
            });
        },

        async delete(dreamId, creatureId) {
            return await ApiService.post(`/meng/creature/delete?dream_id=${dreamId}&creature_id=${creatureId}`);
        },

        async clear(dreamId) {
            return await ApiService.post(`/meng/creature/clear?dream_id=${dreamId}`);
        }
    },

    level: {
        async create(dreamId, name, description, levelType, difficulty, targetX, targetY, targetZ, reward = 0, data = null) {
            return await ApiService.post('/meng/level/create', {
                dream_id: dreamId,
                name,
                description,
                level_type: levelType,
                difficulty,
                target_x: targetX,
                target_y: targetY,
                target_z: targetZ,
                reward,
                data
            });
        },

        async list(dreamId) {
            return await ApiService.get('/meng/level/list', {
                dream_id: dreamId
            });
        },

        async detail(levelId) {
            return await ApiService.get('/meng/level/detail', {
                level_id: levelId
            });
        },

        async update(dreamId, levelId, data = {}) {
            return await ApiService.post('/meng/level/update', {
                dream_id: dreamId,
                level_id: levelId,
                ...data
            });
        },

        async delete(dreamId, levelId) {
            return await ApiService.post(`/meng/level/delete?dream_id=${dreamId}&level_id=${levelId}`);
        },

        async complete(levelId) {
            return await ApiService.post(`/meng/level/complete?level_id=${levelId}`);
        },

        async getCompleted() {
            return await ApiService.get('/meng/level/completed');
        }
    }
};
