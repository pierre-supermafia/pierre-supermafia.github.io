const BASE_WIDTH = 4.4;
const BASE_HEIGHT = 3.3;

const SMALL_GRID_ZOOM_THRESHOLD = 0.8;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

const DEFAULT_RECTANGLE_SIZE = 2;

const GRID_STRONG_COLOR = "#888";
const GRID_WEAK_COLOR = "#bbb";
const SCREEN_FILL_COLOR = "#444";

const SELECTED_CONTOUR_COLOR = "#00f";
const SELECTED_LINE_WIDTH = 5;
const SELECTED_DASH = [20, 5];

const CLICK_DISTANCE_TOLERANCE = 7;

class Viewer {

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        
        this.zoom = 1;
        this.ratio = 1;
        this.setZoom(1);
        this.centerX = 0;
        this.centerY = 0;

        this.isDragging = false;
        this.previousMouseX = 0;
        this.previousMouseY = 0;

        this.rectangles = [];
        this.cameras = [];

        this.selectedCamera = -1;
        this.selectedRectangle = -1;
        this.isManipulatingItem = false;
        
        this.cameras.push(new Camera(-1, 0.25, "D435", this));
        this.rectangles.push(new Rectangle(0, 0, 1.21, 0.68, this)); // first rectangle of the array is the screen

        this.setupListeners();

        this.render();
    }

    /**
     * Converts the world coordinates to the canvas coordinates
     * @param {number} x 
     * @param {number} y 
     */
    w2c(x, y) {
        return [
            this.canvas.width / 2 + this.ratio * (this.centerX + x),
            this.canvas.height / 2 + this.ratio * (this.centerY + y)
        ];
    }

    /**
     * Converts the canvas coordinates to the world coordinates
     * @param {number} x 
     * @param {number} y 
     */
    c2w(x, y) {
        return [
            (x - this.canvas.width / 2) / this.ratio - this.centerX,
            (y - this.canvas.height / 2) / this.ratio - this.centerY
        ];
    }

    /**
     * Return true if the given mouse click is close enough to the target
     * 
     * @param {number} targetX x component of the target in world coordinates
     * @param {number} targetY y component of the target in world coordinates
     * @param {number} mouseX x component of the mouse location in canvas coordinates
     * @param {number} mouseY y component of the mouse location in canvas coordinates
     * @param {number} extraRadius Radius of the target (in world scale) 
     */
    isClickable(targetX, targetY, mouseX, mouseY, extraRadius = 0) {
        let tx, ty, mx, my;
        [tx, ty] = this.w2c(targetX, targetY);
        [mx, my] = this.w2c(mouseX, mouseY);

        let dx = tx - mx;
        let dy = ty - my;
        
        let r = CLICK_DISTANCE_TOLERANCE + extraRadius * this.ratio;

        return dx * dx + dy * dy < r * r;
    }

    /**
     * Creates listeners for all the canvas actions as well as for all the input actions
     */
    setupListeners() {
        // Canvas listeners
        this.canvas.addEventListener("wheel", (event) => this.onWheel(event), false);
        this.canvas.addEventListener("mousedown", (event) => {
            if (event.button === 0) {
                this.onLeftMouseDown(event);
            } else if (event.button === 2) {
                this.onRightMouseDown(event);
            }
        }, false);
        this.canvas.addEventListener("mouseup", (event) => {
            if (event.button === 0) {
                this.onLeftMouseUp(event);
            } else if (event.button === 2) {
                this.onRightMouseUp(event);
            }
        }, false);
        this.canvas.addEventListener("mousemove", (event) => this.onMouseMove(event));
        this.canvas.addEventListener("contextmenu", (event) => {event.preventDefault();});

        // Buttons listeners
        document.getElementById("add-rect").addEventListener("click", (event) => {
            this.addRectangle();
        });
        document.getElementById("add-cam").addEventListener("click", (event) => {
            this.addCamera();
        });

        // Input listeners
        document.getElementById("rect-x").addEventListener("input", (event) => {
            if (this.selectedRectangle >= 0) {
                this.rectangles[this.selectedRectangle].x = event.target.value;
            }
        });
        document.getElementById("rect-y").addEventListener("input", (event) => {
            if (this.selectedRectangle >= 0) {
                this.rectangles[this.selectedRectangle].y = event.target.value;
            }
        });
        document.getElementById("rect-w").addEventListener("input", (event) => {
            if (this.selectedRectangle >= 0) {
                this.rectangles[this.selectedRectangle].w = event.target.value;
            }
        });
        document.getElementById("rect-h").addEventListener("input", (event) => {
            if (this.selectedRectangle >= 0) {
                this.rectangles[this.selectedRectangle].h = event.target.value;
            }
        });
        document.getElementById("cam-x").addEventListener("input", (event) => {
            if (this.selectedCamera >= 0) {
                this.cameras[this.selectedCamera].x = event.target.value;
            }
        });
        document.getElementById("cam-y").addEventListener("input", (event) => {
            if (this.selectedCamera >= 0) {
                this.cameras[this.selectedCamera].y = event.target.value;
            }
        });
        document.getElementById("cam-alpha").addEventListener("input", (event) => {
            if (this.selectedCamera >= 0) {
                this.cameras[this.selectedCamera].alpha = event.target.value * DEG_TO_RAD;
            }
        });
        document.getElementById("cam-type").addEventListener("input", (event) => {
            if (this.selectedCamera >= 0) {
                this.cameras[this.selectedCamera].setType(event.target.value);
            }
        });
    }

    /**
     * Set the zoom
     * 
     * @param {number} zoom 
     */
    setZoom(zoom) {
        this.zoom = zoom;
        this.ratio = zoom * this.canvas.width / BASE_WIDTH;
    }

    onWheel(event) {
        event.preventDefault();

        this.zoom += event.deltaY * -0.01;
        this.setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.zoom)));
    }

    onRightMouseDown(event) {
        event.preventDefault();

        this.isDragging = true;
        this.previousMouseX = event.offsetX;
        this.previousMouseY = event.offsetY;
    }

    onRightMouseUp(event) {
        event.preventDefault();

        this.isDragging = false;
    }

    onLeftMouseDown(event) {
        let x, y;
        [x, y] = this.c2w(event.offsetX, event.offsetY);

        if (this.selectedCamera >= 0) {
            let cam = this.cameras[this.selectedCamera];
            if (cam.handleMouseDown(x, y)) {
                this.isManipulatingItem = true;
                return;
            }
        } else if (this.selectedRectangle >= 0) {
            let rect = this.rectangles[this.selectedRectangle];
            if (rect.handleMouseDown(x, y)) {
                this.isManipulatingItem = true;
                return;
            }
        }

        // Not an action on the selected item
        // => change or reset select

        this.selectedCamera = -1;
        document.getElementById("cam-container").hidden = true;
        this.selectedRectangle = -1;
        document.getElementById("rect-container").hidden = true;


        // Object select : cameras have priority
        for (let i = 0; i < this.cameras.length; ++i) {
            let camera = this.cameras[i];
            if (camera.isPointInSelectRadius(x, y)) {
                this.selectCamera(i);
                return;
            }
        }

        // Smallest rectangle that is selected wins
        let minArea = Infinity;
        let selected = -1;
        for (let i = 0; i < this.rectangles.length; ++i) {
            let rect = this.rectangles[i];
            let area = rect.getArea();
            if (rect.isPointInSelectRadius(x, y) && area < minArea) {
                selected = i;
                minArea = area;
            }
        }
        if (selected >= 0) {
            this.selectRectangle(selected);
        }
    }
    
    /**
     * Change the currently selected item (if any) to the given camera
     * 
     * @param {number} i Number of the newly selected camera
     */
    selectCamera(i) {
        this.selectedCamera = i;
        this.selectedRectangle = -1;
        const cam = this.cameras[this.selectedCamera];

        document.getElementById("cam-container").hidden = false;
        switch (cam.type) {
            default:
            case "D435":
                document.getElementById("cam-type").value = "D435 avec squelette";
                break;
            case "D435_RS":
                document.getElementById("cam-type").value = "D435 sans squelette";
                break;
            case "D415":
                document.getElementById("cam-type").value = "D415 avec squelette";
                break;
            case "D415_RS":
                document.getElementById("cam-type").value = "D415 sans squelette";
                break;
        }
        document.getElementById("cam-x").value = cam.x;
        document.getElementById("cam-y").value = cam.y;
        document.getElementById("cam-alpha").value = cam.alpha / DEG_TO_RAD;
    }
    
    /**
     * Change the currently selected item (if any) to the given rectangle
     * 
     * @param {number} i Number of the newly selected rectangle
     */
    selectRectangle(i) {
        this.selectedRectangle = i;
        this.selectedCamera = -1;
        const rect = this.rectangles[this.selectedRectangle];

        document.getElementById("rect-container").hidden = false;
        document.getElementById("rect-x").value = rect.x;
        document.getElementById("rect-y").value = rect.y;
        document.getElementById("rect-w").value = rect.w;
        document.getElementById("rect-h").value = rect.h;        
    }

    onLeftMouseUp(event) {
        this.isManipulatingItem = false;
    }

    onMouseMove(event) {
        if (this.isDragging) {
            this.centerX += (event.offsetX - this.previousMouseX) / this.ratio;
            this.centerY += (event.offsetY - this.previousMouseY) / this.ratio;
        } else if (this.isManipulatingItem) {
            let x,y ;
            [x, y] = this.c2w(event.offsetX, event.offsetY);
            let dx = (event.offsetX - this.previousMouseX) / this.ratio;
            let dy = (event.offsetY - this.previousMouseY) / this.ratio;

            if (this.selectedCamera >= 0) {
                let cam = this.cameras[this.selectedCamera];
                cam.handleManip(x, y, dx, dy);
            } else if (this.selectedRectangle >= 0) {
                let rect = this.rectangles[this.selectedRectangle];
                rect.handleManip(x, y, dx, dy);
            }
        } else {
            document.body.style.cursor = "default";
            
            let x, y;
            [x, y] = this.c2w(event.offsetX, event.offsetY);
            if (this.selectedCamera >= 0) {
                const cam = this.cameras[this.selectedCamera];
                cam.handleHover(x, y);
            } else if (this.selectedRectangle >= 0) {
                const rect = this.rectangles[this.selectedRectangle];
                rect.handleHover(x, y);
            }
        }

        this.previousMouseX = event.offsetX;
        this.previousMouseY = event.offsetY;
    }

    /**
     * Adds a new rectangle in the scene, and selects it
     */
    addRectangle() {
        console.log("salut")
        this.rectangles.push(new Rectangle(0, 0,
            DEFAULT_RECTANGLE_SIZE, DEFAULT_RECTANGLE_SIZE, this));
        this.selectRectangle(this.rectangles.length - 1);
    }

    /**
     * Adds a new camera in the scene, and selects it
     */
    addCamera() {
        this.cameras.push(new Camera(0, 0, "D435", this));
        this.selectCamera(this.cameras.length - 1);
    }
    
    /**
     * Renders the whole scene
     */
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        this.drawRectangles();
        this.drawCameras();

        requestAnimationFrame(() => this.render());
    }

    /**
     * Draws the grid. If zoomed in enough, the half-grid will appear
     */
    drawGrid() {
        
        this.ctx.strokeStyle = GRID_STRONG_COLOR;
        this.ctx.lineWidth = 2;
        
        const realWidth = BASE_WIDTH / this.zoom;
        const realHeight = BASE_HEIGHT / this.zoom;
        
        const nCols = Math.floor(realWidth);
        const nRows = Math.floor(realHeight);

        let x0;
        let y0;
        [x0, y0] = this.w2c(0, 0);

        this.ctx.beginPath();
        
        for (let i = - nCols; i < nCols; ++i) {
            this.ctx.moveTo(x0 + i * this.ratio, 0);
            this.ctx.lineTo(x0 + i * this.ratio, this.canvas.height);
        }
        
        for (let i = - nRows; i < nRows; ++i) {
            this.ctx.moveTo(0, y0 + i * this.ratio);
            this.ctx.lineTo(this.canvas.width, y0 + i * this.ratio);
        }

        if (this.zoom > SMALL_GRID_ZOOM_THRESHOLD) {
            this.ctx.lineWidth = 1;
            this.ctx.color = GRID_WEAK_COLOR;
            this.ctx.setLineDash([10, 10]);

            for (let i = - 2 * nCols; i < 2 * nCols; ++i) {
                this.ctx.moveTo(x0 + i * this.ratio / 2, 0);
                this.ctx.lineTo(x0 + i * this.ratio / 2, this.canvas.height);
            }

            for (let i = - 2 * nRows; i < 2 * nRows; ++i) {
                this.ctx.moveTo(0, y0 + i * this.ratio / 2);
                this.ctx.lineTo(this.canvas.width, y0 + i * this.ratio / 2);
            }

            this.ctx.setLineDash([]);
        }

        this.ctx.stroke();
    }

    /**
     * Draws all the rectangles
     */
    drawRectangles() {
        this.ctx.fillStyle = SCREEN_FILL_COLOR;
        this.ctx.strokeStyle = "#000";

        for (let i = 0; i < this.rectangles.length; ++i) {
            const rect = this.rectangles[i];
            rect.draw(this.ctx, i === this.selectedRectangle, i === 0);
        }
    }

    // Draws all the cameras
    drawCameras() {
        for (let i = 0; i < this.cameras.length; ++i) {
            const cam = this.cameras[i];
            cam.draw(this.ctx, i === this.selectedCamera);
        }
    }
}