globalThis.CL = {
    /** @type {HTMLInputElement} */
    w_input: null,
    /** @type {HTMLInputElement} */
    h_input: null,
    /** @type {HTMLCanvasElement} */
    canvas: null,

    correctEndian: (() => {
        var arrayBuffer = new ArrayBuffer(2);
        var uint8Array = new Uint8Array(arrayBuffer);
        var uint16array = new Uint16Array(arrayBuffer);
        uint8Array[0] = 0x11;
        uint8Array[1] = 0xEE;
        if(uint16array[0] === 0xEE11) return false;
        
        // This one is obviously the correct way to order bytes. Damn hardware developers and their probably
        // reasonable arguments for not using it.
        if(uint16array[0] === 0x11EE) return true;
        console.error("Your computer failed the endian-test and will be reported to the government! Also, the colors might look wrong.");
        return false;
    })(),

    init() {
        this.w_input = document.getElementById("cl_w");
        this.h_input = document.getElementById("cl_h");
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.world = new CL.world(300, 300);
        document.body.appendChild(this.canvas);
    },

    step() {
        this.world.step();
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
            newWorld.draw();
/*            const oldWorld = this;

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
            }*/

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

        async draw() {
            const canvas = CL.canvas;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.createImageData(this.width, this.height, { colorSpace: 'srgb' });
            const img32 = new Uint32Array(imageData.data.buffer);
            const bytes = Math.ceil(this.width * this.height / 8);

            const onColor = CL.fixByteOrder(0x000000FF);
            const offColor = CL.fixByteOrder(0x888888FF);

            for (let byteIdx = 0; byteIdx < bytes; ++byteIdx) {
                const worldByte = this.data[byteIdx] | 0b01010101;
                const pxOffset = (byteIdx * 8);

                img32[pxOffset + 0] = worldByte & 0b10000000 ? onColor : offColor;
                img32[pxOffset + 1] = worldByte & 0b01000000 ? onColor : offColor;
                img32[pxOffset + 2] = worldByte & 0b00100000 ? onColor : offColor;
                img32[pxOffset + 3] = worldByte & 0b00010000 ? onColor : offColor;
                img32[pxOffset + 4] = worldByte & 0b00001000 ? onColor : offColor;
                img32[pxOffset + 5] = worldByte & 0b00000100 ? onColor : offColor;
                img32[pxOffset + 6] = worldByte & 0b00000010 ? onColor : offColor;
                img32[pxOffset + 7] = worldByte & 0b00000001 ? onColor : offColor;
            }
            const bmp = await createImageBitmap(imageData);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(bmp, 0, 0, this.width * 16, this.height * 16);
        }
    },

    /**
     * @param {number} data 
     */
    fixByteOrder (data) {
        if (CL.correctEndian) return data;
        return parseInt(Array.from(data.toString(16).padStart(8, '0')).reverse().join(''), 16);
    }
}


