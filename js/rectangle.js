class Rectangle {

    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    getArea() {
        return this.w * this.h;
    }

    isSelected(x, y) {
        return this.x - this.w / 2 < x && x < this.x + this.w / 2
            && this.y - this.h / 2 < y && y < this.y + this.h / 2;
    }
}