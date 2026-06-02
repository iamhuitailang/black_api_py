const Block3D = {
    BLOCK_TYPES: {
        grass: {
            name: '草地',
            icon: '🌿',
            colors: {
                top: '#7cb342',
                side: '#8d6e63',
                bottom: '#5d4037'
            }
        },
        stone: {
            name: '石头',
            icon: '🪨',
            colors: {
                top: '#9e9e9e',
                side: '#757575',
                bottom: '#616161'
            }
        },
        wood: {
            name: '木头',
            icon: '🪵',
            colors: {
                top: '#a1887f',
                side: '#6d4c41',
                bottom: '#5d4037'
            }
        },
        glass: {
            name: '玻璃',
            icon: '🔮',
            colors: {
                top: 'rgba(179, 229, 252, 0.7)',
                side: 'rgba(129, 212, 250, 0.6)',
                bottom: 'rgba(79, 195, 247, 0.7)'
            },
            transparent: true
        },
        light: {
            name: '发光方块',
            icon: '💡',
            colors: {
                top: '#fff59d',
                side: '#ffee58',
                bottom: '#fbc02d'
            },
            glow: true
        },
        dream_block: {
            name: '梦境方块',
            icon: '💫',
            colors: {
                top: '#ce93d8',
                side: '#ab47bc',
                bottom: '#7b1fa2'
            },
            glow: true
        }
    },

    create(blockData, size = 50) {
        const { x, y, z, block_type, color, id } = blockData;
        const blockType = this.BLOCK_TYPES[block_type] || this.BLOCK_TYPES.grass;
        const colors = color ? this.createCustomColors(color) : blockType.colors;

        const block = document.createElement('div');
        block.className = 'block-3d';
        block.dataset.blockId = id || '';
        block.dataset.x = x;
        block.dataset.y = y;
        block.dataset.z = z;
        block.dataset.blockType = block_type;

        const transform = this.getPositionTransform(x, y, z, size);
        block.style.transform = transform;
        block.style.width = size + 'px';
        block.style.height = size + 'px';

        if (blockType.glow) {
            block.classList.add('block-glow');
        }
        if (blockType.transparent) {
            block.classList.add('block-transparent');
        }

        block.innerHTML = `
            <div class="block-face block-top" style="background: ${colors.top}; transform: rotateX(90deg) translateZ(${size/2}px); width: ${size}px; height: ${size}px;"></div>
            <div class="block-face block-bottom" style="background: ${colors.bottom}; transform: rotateX(-90deg) translateZ(${size/2}px); width: ${size}px; height: ${size}px;"></div>
            <div class="block-face block-front" style="background: ${colors.side}; transform: translateZ(${size/2}px); width: ${size}px; height: ${size}px;"></div>
            <div class="block-face block-back" style="background: ${colors.side}; transform: rotateY(180deg) translateZ(${size/2}px); width: ${size}px; height: ${size}px;"></div>
            <div class="block-face block-left" style="background: ${colors.side}; transform: rotateY(-90deg) translateZ(${size/2}px); width: ${size}px; height: ${size}px;"></div>
            <div class="block-face block-right" style="background: ${colors.side}; transform: rotateY(90deg) translateZ(${size/2}px); width: ${size}px; height: ${size}px;"></div>
        `;

        return block;
    },

    createCustomColors(baseColor) {
        const rgb = ColorUtils.hexToRgb(baseColor);
        if (!rgb) return this.BLOCK_TYPES.grass.colors;

        const adjust = (r, g, b, factor) => {
            return ColorUtils.rgbToHex(
                Math.min(255, Math.max(0, r * factor)),
                Math.min(255, Math.max(0, g * factor)),
                Math.min(255, Math.max(0, b * factor))
            );
        };

        return {
            top: adjust(rgb.r, rgb.g, rgb.b, 1.1),
            side: baseColor,
            bottom: adjust(rgb.r, rgb.g, rgb.b, 0.8)
        };
    },

    getPositionTransform(x, y, z, size) {
        return `translate3d(${x * size}px, ${-y * size}px, ${z * size}px)`;
    },

    getBlockType(type) {
        return this.BLOCK_TYPES[type] || this.BLOCK_TYPES.grass;
    },

    getAllBlockTypes() {
        return Object.entries(this.BLOCK_TYPES).map(([key, value]) => ({
            type: key,
            ...value
        }));
    }
};

window.Block3D = Block3D;
