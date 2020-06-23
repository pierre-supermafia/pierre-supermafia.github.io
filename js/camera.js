// TODO: these values aren't real

const D435_MIN_RANGE = 1.5;
const D435_MAX_RANGE = 2.5;
const D435_FOV = 76;
const D435_COLOR = "rgba(0, 255, 0, 0.5)";

const D415_MIN_RANGE = 1.5;
const D415_MAX_RANGE = 4.5;
const D415_FOV = 50;
const D415_COLOR = "rgba(0, 0, 255, 0.5)";

const D435_RS_MIN_RANGE = 1.5;
const D435_RS_MAX_RANGE = 10;
const D435_RS_COLOR = "rgba(255, 255, 0, 0.5)";

const D415_RS_MIN_RANGE = 1.5;
const D415_RS_MAX_RANGE = 15;
const D415_RS_COLOR = "rgba(255, 255, 0, 0.5)";

const MAX_SELECTION_DISTANCE = 0.3;

class Camera {

    constructor(x, y, type){
        this.x = x;
        this.y = y;

        this.alpha = 0;

        switch (type) {
            case "D435":
                this.minRange = D435_MIN_RANGE;
                this.maxRange = D435_MAX_RANGE;
                this.FoV = D435_FOV;
                this.color = D435_COLOR;
                break;
            case "D435_RS":
                this.minRange = D435_RS_MIN_RANGE;
                this.maxRange = D435_RS_MAX_RANGE;
                this.FoV = D435_FOV;
                this.color = D435_RS_COLOR;
                break;
            case "D415":
                this.minRange = D415_MIN_RANGE;
                this.maxRange = D415_MAX_RANGE;
                this.FoV = D415_FOV;
                this.color = D415_COLOR;
                break;
            case "D415_RS":
                this.minRange = D415_RS_MIN_RANGE;
                this.maxRange = D415_RS_MAX_RANGE;
                this.FoV = D415_FOV;
                this.color = D415_RS_COLOR;
                break;
            default:
                throw "Wrong parameter in for type";
        }
    }

    isSelected(x, y) {
        let dx = this.x - x;
        let dy = this.y - y;
        return dx * dx + dy * dy < MAX_SELECTION_DISTANCE * MAX_SELECTION_DISTANCE;
    }

}