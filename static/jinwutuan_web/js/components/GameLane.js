const GameLane = {
    template: `
        <div class="game-lane">
            <div 
                v-for="note in visibleNotes" 
                :key="note.id"
                class="note"
                :class="{ hit: note.hit }"
                :style="{ 
                    top: note.position + 'px',
                    '--note-color': laneColor 
                }"
            ></div>
            <div 
                class="lane-key"
                :class="{ pressed: isPressed }"
                :style="{ '--lane-color': laneColor }"
            >
                {{ laneKey }}
            </div>
        </div>
    `,
    props: {
        notes: {
            type: Array,
            required: true
        },
        laneKey: {
            type: String,
            required: true
        },
        laneColor: {
            type: String,
            default: '#00f5ff'
        },
        isPressed: {
            type: Boolean,
            default: false
        },
        gameHeight: {
            type: Number,
            default: 500
        },
        hitZoneY: {
            type: Number,
            default: 430
        }
    },
    setup(props) {
        const { computed } = Vue;
        
        const visibleNotes = computed(() => {
            return props.notes.filter(note => {
                return !note.hit && !note.missed && note.position > -30 && note.position < props.gameHeight;
            });
        });
        
        return {
            visibleNotes
        };
    }
};
