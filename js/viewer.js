const BASE_WIDTH = 4.4;
const BASE_HEIGHT = 3.3;

const SMALL_GRID_ZOOM_THRESHOLD = 0.8;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

const CAMERA_SIZE = 0.05;

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

    w2c(x, y) {
        return [
            this.canvas.width / 2 + this.ratio * (this.centerX + x),
            this.canvas.height / 2 + this.ratio * (this.centerY + y)
        ];
    }

    c2w(x, y) {
        return [
            (x - this.canvas.width / 2) / this.ratio - this.centerX,
            (y - this.canvas.height / 2) / this.ratio - this.centerY
        ];
    }

    isClickable(targetX, targetY, mouseX, mouseY, extraRadius = 0) {
        // args in world coordinates
        let tx, ty, mx, my;
        [tx, ty] = this.w2c(targetX, targetY);
        [mx, my] = this.w2c(mouseX, mouseY);
        let dx = tx - mx;
        let dy = ty - my;
        
        let r = CLICK_DISTANCE_TOLERANCE + extraRadius * this.ratio;

        return dx * dx + dy * dy < r * r;
    }

    setupListeners() {
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
    }

    setZoom(zoom) {
        this.zoom = zoom;
        this.ratio = zoom * this.canvas.width / BASE_WIDTH;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        this.drawRectangles();
        this.drawCameras();

        requestAnimationFrame(() => this.render());
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
        this.selectedRectangle = -1;


        // Object select : cameras have priority
        for (let i = 0; i < this.cameras.length; ++i) {
            let camera = this.cameras[i];
            if (camera.isPointInSelectRadius(x, y)) {
                this.selectedCamera = i;
                return;
            }
        }

        // Smallest rectangle that is selected wins
        let minArea = Infinity;
        for (let i = 0; i < this.rectangles.length; ++i) {
            let rect = this.rectangles[i];
            if (rect.isPointInSelectRadius(x, y) && rect.getArea() < minArea) {
                this.selectedRectangle = i;
            }
        }
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
            } else {
                console.log("What is happening");
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
            this.ctx.stroke();
        }
        
        for (let i = - nRows; i < nRows; ++i) {
            this.ctx.moveTo(0, y0 + i * this.ratio);
            this.ctx.lineTo(this.canvas.width, y0 + i * this.ratio);
            this.ctx.stroke();
        }

        if (this.zoom > SMALL_GRID_ZOOM_THRESHOLD) {
            this.ctx.lineWidth = 1;
            this.ctx.color = GRID_WEAK_COLOR;
            this.ctx.setLineDash([10, 10]);

            for (let i = - 2 * nCols; i < 2 * nCols; ++i) {
                this.ctx.moveTo(x0 + i * this.ratio / 2, 0);
                this.ctx.lineTo(x0 + i * this.ratio / 2, this.canvas.height);
                this.ctx.stroke();
            }

            for (let i = - 2 * nRows; i < 2 * nRows; ++i) {
                this.ctx.moveTo(0, y0 + i * this.ratio / 2);
                this.ctx.lineTo(this.canvas.width, y0 + i * this.ratio / 2);
                this.ctx.stroke();
            }

            this.ctx.setLineDash([]);
        }
    }

    drawRectangles() {
        this.ctx.fillStyle = SCREEN_FILL_COLOR;
        this.ctx.strokeStyle = "#000";

        for (let i = 0; i < this.rectangles.length; ++i) {
            const rect = this.rectangles[i];
            rect.draw(this.ctx, i === this.selectedRectangle, i === 0);
        }
    }

    drawCameras() {
        for (let i = 0; i < this.cameras.length; ++i) {
            const cam = this.cameras[i];
            cam.draw(this.ctx, i === this.selectedCamera);
        }
    }
}