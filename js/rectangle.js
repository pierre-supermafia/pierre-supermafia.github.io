const RECTANGLE_FILL_COLOR = "#d0d0d0"

class Rectangle {

    State = {
        DEFAULT: 0,
        MOVING: 1,
        RESIZE_NW: 2,
        RESIZE_NE: 3,
        RESIZE_SW: 4,
        RESIZE_SE: 5,
        RESIZE_N: 6,
        RESIZE_W: 7,
        RESIZE_E: 8,
        RESIZE_S: 9
    };

    constructor(x, y, w, h, viewer) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.state = this.State.DEFAULT;

        this.viewer = viewer;
    }

    /**
     * Compute the area of the rectangle
     */
    getArea() {
        return this.w * this.h;
    }

    /**
     * Change the mouse icon according to it position
     * 
     * @param {number} x 
     * @param {number} y 
     */
    handleHover(x, y) {
        if (this.isPointInCornerRadius(x, y, 0)) {
            document.body.style.cursor = "nw-resize";
        } else if (this.isPointInCornerRadius(x, y, 1)) {
            document.body.style.cursor = "ne-resize";
        } else if (this.isPointInCornerRadius(x, y, 2)) {
            document.body.style.cursor = "sw-resize";
        } else if (this.isPointInCornerRadius(x, y, 3)) {
            document.body.style.cursor = "se-resize";
        } else if (this.isPointInSideRadius(x, y, 0)) {
            document.body.style.cursor = "n-resize";
        } else if (this.isPointInSideRadius(x, y, 1)) {
            document.body.style.cursor = "w-resize";
        } else if (this.isPointInSideRadius(x, y, 2)) {
            document.body.style.cursor = "s-resize";
        } else if (this.isPointInSideRadius(x, y, 3)) {
            document.body.style.cursor = "e-resize";
        } else if (this.isPointInSelectRadius(x, y)) {
            document.body.style.cursor = "grab";
        }
    }

    /**
     * Update the state according to the point clicked
     * 
     * @param {number} x 
     * @param {number} y 
     */
    handleMouseDown(x, y) {
        if (this.isPointInCornerRadius(x, y, 0)) {
            this.state = this.State.RESIZE_NW;
        } else if (this.isPointInCornerRadius(x, y, 1)) {
            this.state = this.State.RESIZE_NE;
        } else if (this.isPointInCornerRadius(x, y, 2)) {
            this.state = this.State.RESIZE_SW;
        } else if (this.isPointInCornerRadius(x, y, 3)) {
            this.state = this.State.RESIZE_SE;
        } else if (this.isPointInSideRadius(x, y, 0)) {
            this.state = this.State.RESIZE_N;
        } else if (this.isPointInSideRadius(x, y, 1)) {
            this.state = this.State.RESIZE_W;
        } else if (this.isPointInSideRadius(x, y, 2)) {
            this.state = this.State.RESIZE_S;
        } else if (this.isPointInSideRadius(x, y, 3)) {
            this.state = this.State.RESIZE_E;
        } else if (this.isPointInSelectRadius(x, y)) {
            this.state = this.State.MOVING;
            document.body.style.cursor = "grabbing";
        } else {
            return false;
        }
        return true;
    }

    /**
     * Handle the movement while the left mouse button is held down
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} dx 
     * @param {number} dy 
     */
    handleManip(x, y, dx, dy) {
        switch (this.state) {
            case this.State.MOVING:
                this.x += dx;
                this.y += dy;
                break;
            case this.State.RESIZE_NW:
                this.x += dx / 2;
                this.y += dy / 2;
                this.w -= dx;
                this.h -= dy;
                break;
            case this.State.RESIZE_NE:
                this.x += dx / 2;
                this.y += dy / 2;
                this.w += dx;
                this.h -= dy;
                break;
            case this.State.RESIZE_SW:
                this.x += dx / 2;
                this.y += dy / 2;
                this.w -= dx;
                this.h += dy;
                break;
            case this.State.RESIZE_SE:
                this.x += dx / 2;
                this.y += dy / 2;
                this.w += dx;
                this.h += dy;
                break;
            case this.State.RESIZE_N:
                this.y += dy / 2;
                this.h -= dy;
                break;
            case this.State.RESIZE_W:
                this.x += dx / 2;
                this.w -= dx;
                break;
            case this.State.RESIZE_E:
                this.x += dx / 2;
                this.w += dx;
                break;
            case this.State.RESIZE_S:
                this.y += dy / 2;
                this.h += dy;
                break;
            case this.State.DEFAULT:
            default:
                break;
        }
    }

    /**
     * Returns true if the given point is in the selection region of the rectangle
     * 
     * @param {number} x 
     * @param {number} y 
     */
    isPointInSelectRadius(x, y) {
        return this.x - this.w / 2 < x && x < this.x + this.w / 2
            && this.y - this.h / 2 < y && y < this.y + this.h / 2;
    }

    /**
     * Returns true if the given point is in the selection region of the given corner
     * @param {number} x 
     * @param {number} y 
     * @param {number} numCorner number denoting the corner to test
     *  0 ____ 1
     *  |      |
     *  2 ____ 3
     */
    isPointInCornerRadius(x, y, numCorner) {
        const cx = (numCorner % 2 === 0) ? this.x - this.w / 2 : this.x + this.w / 2;
        const cy = (numCorner < 2)       ? this.y - this.h / 2 : this.y + this.h / 2;
        return this.viewer.isClickable(cx, cy, x, y);
    }

    /**
     * Returns true if the given point is in the selection region of the given side
     * @param {number} x 
     * @param {number} y 
     * @param {number} numSide number denoting the side to test
     * __ 0 __
     * |     |
     * 1     3
     * |     |
     * __ 2 __
     */
    isPointInSideRadius(x, y, numSide) {
        if (numSide % 2 === 0) {
            const cy = (numSide === 0) ? this.y - this.h / 2 : this.y + this.h / 2;
            return this.x - this.w / 2 < x && x < this.x + this.w / 2
                &&  this.viewer.isClickable(x, cy, x, y);
        } else {
            const cx = (numSide === 1) ? this.x - this.w / 2 : this.x + this.w / 2;
            return this.y -this.h / 2 < y && y < this.y + this.h / 2
                && this.viewer.isClickable(cx, y, x, y);
        }
    }

    /**
     * Draw the rectangle in the given graphical context
     * 
     * @param {*} ctx 
     * @param {boolean} selected 
     * @param {string} fill color to fill in 
     */
    draw(ctx, selected, fillColor = RECTANGLE_FILL_COLOR) {
        let x, y;
        [x, y] = this.viewer.w2c(this.x, this.y);
        const w = this.w * this.viewer.ratio;
        const h = this.h * this.viewer.ratio;

        if (selected) {
            ctx.lineWidth = SELECTED_LINE_WIDTH;
            ctx.strokeStyle = SELECTED_CONTOUR_COLOR;
            ctx.setLineDash(SELECTED_DASH);
        }

        ctx.fillStyle = fillColor;
        ctx.fillRect(x - w / 2, y - h / 2, w, h);
        ctx.strokeRect(x - w / 2, y - h / 2, w, h);

        // reset style
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000";
        ctx.setLineDash([]);
    }
}