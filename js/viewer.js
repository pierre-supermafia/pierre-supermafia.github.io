const BASE_WIDTH = 4.4;
const BASE_HEIGHT = 3.3;

const SMALL_GRID_ZOOM_THRESHOLD = 0.8;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

const CAMERA_SIZE = 0.05;

class Viewer {

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        
        this.zoom = 1;
        this.ratio = 1;
        this.setZoom(1);
        this.centerX = 0;
        this.centerY = 0;

        this.isMoving = false;
        this.previousMoveX = 0;
        this.previousMoveY = 0;

        this.rectangles = [];
        this.cameras = [];

        this.rectangles.push(new Rectangle(0, 0, 1.21, 0.68)); // Screen
        this.cameras.push(new Camera(-1, 0, "D435"));

        this.setupListeners();

        this.render();
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
        this.ctx.beginPath();

        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
        this.isMoving = true;
        this.previousMoveX = event.offsetX;
        this.previousMoveY = event.offsetY;

        console.log("sauce")
    }

    onRightMouseUp(event) {
        event.preventDefault();
        this.isMoving = false;
    }

    onLeftMouseDown(event) {
        
    }

    onLeftMouseUp(event) {
        
    }

    onMouseMove(event) {
        if (this.isMoving) {
            
            this.centerX += (event.offsetX - this.previousMoveX) / this.ratio;
            this.centerY += (event.offsetY - this.previousMoveY) / this.ratio;
            
            this.previousMoveX = event.offsetX;
            this.previousMoveY = event.offsetY;
            
            console.log(this.centerX)
        }
    }

    drawGrid() {
        
        this.ctx.strokeStyle = "#999"
        this.ctx.lineWidth = 2;
        
        const realWidth = BASE_WIDTH / this.zoom;
        const realHeight = BASE_HEIGHT / this.zoom;
        
        const nCols = Math.floor(realWidth);
        const nRows = Math.floor(realHeight);

        const x0 = (this.canvas.width / 2) + this.centerX * this.ratio;
        const y0 = (this.canvas.height / 2) + this.centerY * this.ratio;
        
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
            this.ctx.color = "#bbb"

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
        }
    }

    drawRectangles() {
        this.ctx.fillStyle = "#444";
        for (let i = 0; i < this.rectangles.length; ++i) {
            const rect = this.rectangles[i];
            const x = (this.centerX + rect.x) * this.ratio + canvas.width / 2;
            const y = (this.centerY + rect.y) * this.ratio + canvas.height / 2;
            const w = rect.w * this.ratio;
            const h = rect.h * this.ratio;

            this.ctx.fillRect(x - w / 2, y - h / 2, w, h);
        }
    }

    drawCameras() {
        for (let i = 0; i < this.cameras.length; ++i) {
            const cam = this.cameras[i];
            
            this.ctx.fillStyle = cam.color;
                
            const x = canvas.width / 2  + (this.centerX + cam.x) * this.ratio;
            const y = canvas.height / 2  + (this.centerY + cam.y) * this.ratio;

            // Draw camera
            this.ctx.beginPath();
            this.ctx.arc(x, y, CAMERA_SIZE * this.ratio, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.fill();

            // Draw its range
            this.ctx.beginPath();
            this.ctx.arc(x, y, cam.minRange * this.ratio, (cam.alpha - cam.FoV / 2) * Math.PI / 180,
            (cam.alpha + cam.FoV / 2) * Math.PI / 180, false);
            this.ctx.arc(x, y, cam.maxRange * this.ratio, (cam.alpha + cam.FoV / 2) * Math.PI / 180,
            (cam.alpha - cam.FoV / 2) * Math.PI / 180, true);
            this.ctx.fill();
        }
    }
}