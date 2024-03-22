globalThis.CL = {
    /** @type {HTMLInputElement} */
    w_input: null,
    /** @type {HTMLInputElement} */
    h_input: null,

    init() {
        this.w_input = document.getElementById("cl_w");
        this.h_input = document.getElementById("cl_h");
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.canvas);
    },

    world: class World {
        /**
         * @param {number} width 
         * @param {number} height 
         */
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.data = new Uint8Array(Math.ceil(width * height / 8));
        }

        step() {
            const newWorld = new World(this.width, this.height);
            const oldWorld = this;

            for (let x = 0; x < this.width; ++x) {
                for (let y = 0; y < this.height; ++y) {
                    let own = lookup(x, y)
                    const neighbors = lookup(x-1, y-1) + lookup(x, y-1) + lookup(x+1, y-1)
                        + lookup(x-1, y) + lookup(x+1, y)
                        + lookup(x-1, y+1) + lookup(x, y+1) + lookup(x+1, y+1);
                    
                    if (own == 0) {
                        if (neighbors === 3) own = 1
                    } else {
                        if (neighbors < 2 || neighbors > 3) own = 0;
                    }

                    const idx = x + y * oldWorld.width;
                    const chunk = Math.floor(idx / 8);
                    const pos = idx - chunk * 8;
                    newWorld.data[chunk] |= (1 << pos) * own;
                }
            }

            /**
             * @param {number} x
             * @param {number} y
             * @returns {boolean}
             */
            function lookup(x, y) {
                if (x < 0 || x >= oldWorld.width) {
                    return false;
                }
                if (y < 0 || y >= oldWorld.height) {
                    return false;
                }
                const idx = x + y * oldWorld.width;
                const chunk = Math.floor(idx / 8);
                const pos = idx - chunk * 8;
                const chunkData = oldWorld.data[chunk];
                return +!!(chunkData & (1 << pos));
            }
        }

        draw() {

        }
    }
}


