// TODO: these values aren't real

const DEG_TO_RAD = Math.PI / 180;

const D435_MIN_RANGE = 1.5;
const D435_MAX_RANGE = 2.5;
const D435_FOV = 76 * DEG_TO_RAD;
const D435_COLOR = "rgba(0, 255, 0, 0.5)";

const D415_MIN_RANGE = 1.5;
const D415_MAX_RANGE = 4.5;
const D415_FOV = 50 * DEG_TO_RAD;
const D415_COLOR = "rgba(0, 0, 255, 0.5)";

const D435_RS_MIN_RANGE = 1.5;
const D435_RS_MAX_RANGE = 10;
const D435_RS_COLOR = "rgba(255, 255, 0, 0.5)";

const D415_RS_MIN_RANGE = 1.5;
const D415_RS_MAX_RANGE = 15;
const D415_RS_COLOR = "rgba(255, 255, 0, 0.5)";

class Camera {

    State = {
        DEFAULT: 0,
        MOVING: 1,
        ROTATE: 2
    };

    constructor(x, y, type, viewer){
        this.x = x;
        this.y = y;

        this.alpha = 0;

        this.setType(type);

        this.viewer = viewer;
        this.state = this.State.DEFAULT;
    }

    setType(type) {

        switch (type) {
            case "D435":
            case "D435 avec squelette":
                this.type = "D435";
                this.minRange = D435_MIN_RANGE;
                this.maxRange = D435_MAX_RANGE;
                this.FoV = D435_FOV;
                this.color = D435_COLOR;
                break;
            case "D435_RS":
            case "D435 sans squelette":
                this.type = "D435_RS";
                this.minRange = D435_RS_MIN_RANGE;
                this.maxRange = D435_RS_MAX_RANGE;
                this.FoV = D435_FOV;
                this.color = D435_RS_COLOR;
                break;
            case "D415":
            case "D415 avec squelette":
                this.type = "D415";
                this.minRange = D415_MIN_RANGE;
                this.maxRange = D415_MAX_RANGE;
                this.FoV = D415_FOV;
                this.color = D415_COLOR;
                break;
            case "D415_RS":
            case "D415 sans squelette":
                this.type = "D415_RS";
                this.minRange = D415_RS_MIN_RANGE;
                this.maxRange = D415_RS_MAX_RANGE;
                this.FoV = D415_FOV;
                this.color = D415_RS_COLOR;
                break;
        }
    }

    isPointInSelectRadius(x, y) {
        return this.viewer.isClickable(this.x, this.y, x, y, CAMERA_SIZE);
    }

    isPointInRotateRadius(x, y) {
        let tx = this.x + this.maxRange * Math.cos(this.alpha);
        let ty = this.y + this.maxRange * Math.sin(this.alpha);
        return this.viewer.isClickable(tx, ty, x, y, CAMERA_SIZE / 2);
    }

    handleHover(x, y) {
        if (this.isPointInSelectRadius(x, y)
        || this.isPointInRotateRadius(x, y)) {
            document.body.style.cursor = "grab";
        }
    }

    handleMouseDown(x, y) {
        if (this.isPointInSelectRadius(x, y)) {
            this.state = this.State.MOVING;
        } else if (this.isPointInRotateRadius(x, y)) {
            this.state = this.State.ROTATE;
        } else {
            return false;
        }
        return true;
    }

    handleManip(x, y, dx, dy) {
        switch (this.state) {
            case this.State.MOVING:
                this.x += dx;
                this.y += dy;
                break;
            case this.State.ROTATE:
                this.alpha = Math.atan2(y - this.y, x - this.x);
                break;
            default:
                break;
        }
    }

    draw(ctx, selected) {
        ctx.fillStyle = this.color;
                
        let x, y;
        [x, y] = this.viewer.w2c(this.x, this.y);
        let dx = this.viewer.ratio * this.maxRange * Math.cos(this.alpha);
        let dy = this.viewer.ratio * this.maxRange * Math.sin(this.alpha);

        if (selected) {
            ctx.strokeStyle = SELECTED_CONTOUR_COLOR;
            ctx.lineWidth = SELECTED_LINE_WIDTH;
            ctx.setLineDash(SELECTED_DASH);
        }

        // Draw camera
        ctx.beginPath();
        ctx.arc(x, y, CAMERA_SIZE * this.viewer.ratio, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();

        // Draw its direction
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw rotation handle
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, CAMERA_SIZE / 2 * this.viewer.ratio, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();

        // Draw its range
        ctx.beginPath();
        ctx.arc(x, y,
            this.minRange * this.viewer.ratio,
            (this.alpha - this.FoV / 2),
            (this.alpha + this.FoV / 2),
            false
        );
        ctx.arc(x, y,
            this.maxRange * this.viewer.ratio,
            (this.alpha + this.FoV / 2),
            (this.alpha - this.FoV / 2),
            true
        );
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        // reset style
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000";
        ctx.setLineDash([]);
    }
}