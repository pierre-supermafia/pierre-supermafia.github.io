const BASE_WIDTH = 4.4;
const BASE_HEIGHT = 3.3;

const SMALL_GRID_ZOOM_THRESHOLD = 0.8;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10;

const CAMERA_SIZE = 0.05;

const GRID_STRONG_COLOR = "#888";
const GRID_WEAK_COLOR = "#bbb";
const SCREEN_FILL_COLOR = "#444";

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
        this.previousMoveX = 0;
        this.previousMoveY = 0;

        this.rectangles = [];
        this.cameras = [];
        
        this.cameras.push(new Camera(-1, 0.25, "D435"));
        this.screen = new Rectangle(0, 0, 1.21, 0.68);

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
        this.previousMoveX = event.offsetX;
        this.previousMoveY = event.offsetY;
    }

    onRightMouseUp(event) {
        event.preventDefault();

        this.isDragging = false;
    }

    onLeftMouseDown(event) {
        
    }

    onLeftMouseUp(event) {
        
    }

    onMouseMove(event) {
        if (this.isDragging) {
            
            this.centerX += (event.offsetX - this.previousMoveX) / this.ratio;
            this.centerY += (event.offsetY - this.previousMoveY) / this.ratio;
            
            this.previousMoveX = event.offsetX;
            this.previousMoveY = event.offsetY;
            
            console.log(this.centerX)
        }
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
        this.drawRectangle(this.screen, true);

        for (let i = 0; i < this.rectangles.length; ++i) {
            const rect = this.rectangles[i];
            this.drawRectangle(rect);
        }
    }

    drawRectangle(rect, fill = false) {
        let x, y;
        [x, y] = this.w2c(rect.x, rect.y);
        const w = rect.w * this.ratio;
        const h = rect.h * this.ratio;

        if (fill) {
            this.ctx.fillRect(x - w / 2, y - h / 2, w, h);
        } else {
            this.ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        }
    }

    drawCameras() {
        for (let i = 0; i < this.cameras.length; ++i) {
            const cam = this.cameras[i];
            
            this.ctx.fillStyle = cam.color;
                
            let x, y;
            [x, y] = this.w2c(cam.x, cam.y);
            let dx = this.ratio * cam.maxRange * Math.cos(cam.alpha * Math.PI / 180);
            let dy = this.ratio * cam.maxRange * Math.sin(cam.alpha * Math.PI / 180)

            // Draw camera
            this.ctx.beginPath();
            this.ctx.arc(x, y, CAMERA_SIZE * this.ratio, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.fill();

            // Draw its direction
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + dx, y + dy);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Draw rotation handle
            this.ctx.beginPath();
            this.ctx.arc(x + dx, y + dy, CAMERA_SIZE / 2 * this.ratio, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.fill();

            // Draw its range
            this.ctx.beginPath();
            this.ctx.arc(x, y,
                cam.minRange * this.ratio,
                (cam.alpha - cam.FoV / 2) * Math.PI / 180,
                (cam.alpha + cam.FoV / 2) * Math.PI / 180,
                false
            );
            this.ctx.arc(x, y,
                cam.maxRange * this.ratio,
                (cam.alpha + cam.FoV / 2) * Math.PI / 180,
                (cam.alpha - cam.FoV / 2) * Math.PI / 180,
                true
            );
            this.ctx.fill();
        }
    }
}