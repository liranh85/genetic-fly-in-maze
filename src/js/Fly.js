class Fly {
    constructor(settings) {
        this.elmId = settings.elmId;
        this.speed = settings.speed;
        this.width = settings.width;
        this.height = settings.height;
        this.flightDistance = settings.flightDistance;
        this.world = settings.world;
        this.coordinates = {
            x: 0,
            y: 0
        }
    }

    flyTo(direction) {
        let coordinates = this._getNewCoordinates(direction);
        if (this.world.isElementInWorld(coordinates, this.width, this.height) && !this.world.isElementOnOtherElement(coordinates, this.width, this.height, 'block')) {
            this.coordinates = coordinates;
            document.getElementById(this.elmId).style.transform = `translate(${this.coordinates.x}px, ${this.coordinates.y}px)`;
        }
    }

    reachedExit() {
        return this.world.isElementAtExit(this.coordinates, this.width, this.height);
    }

    _getNewCoordinates(direction) {
        const newCoordinates = {
            x: this.coordinates.x,
            y: this.coordinates.y
        }
        if (direction === 'up') {
            newCoordinates.y += this.flightDistance;
        }
        else if (direction === 'down') {
            newCoordinates.y -= this.flightDistance;
        }
        else if (direction === 'forward') {
            newCoordinates.x += this.flightDistance;
        }
        return newCoordinates;
    }
}

export default Fly;