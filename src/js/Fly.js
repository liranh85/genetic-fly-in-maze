class Fly {
    constructor(settings) {
        this.elmId = settings.elmId;
        this.interval = settings.interval;
        this.width = settings.width;
        this.height = settings.height;
        this.flightDistance = settings.flightDistance;
        this.world = settings.world;
        this.coordinates = {
            x: 0,
            y: 0
        }
        this.flyElm = this._createFlyElement();
        this.isFree = false;
    }

    _createFlyElement() {
        const flyElm = document.createElement('div');
        flyElm.id = this.elmId;
        flyElm.setAttribute('class', 'fly');
        flyElm.style.width = `${this.width}px`;
        flyElm.style.height = `${this.height}px`;
        flyElm.style.transitionDuration = `${this.interval}ms`;
        this.world.worldElm.appendChild(flyElm);
        return flyElm;
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

    flyTo(direction) {
        if(this.isFree) {
            return;
        }
        let coordinates = this._getNewCoordinates(direction);
        if (this.reachedExit(coordinates)) {
            this.isFree = true;
            this.coordinates.x += 50;
            this.flyElm.style.transitionDuration = '1s';
            this.flyElm.style.transform = `translate(${this.coordinates.x}px, ${this.coordinates.y}px)`;
            window.setTimeout(() => {
                const oldTransform = this.flyElm.style.transform;
                this.flyElm.style.transitionDuration = '.75s';
                this.flyElm.style.transform += 'scale(2)';
                window.setTimeout(() => {
                    this.flyElm.style.transform = oldTransform;
                }, 750)
            }, 2000);
        }
        else if (this.world.isElementInWorld(coordinates, this.width, this.height)
        && !this.world.isElementOnOtherElement(coordinates, this.width, this.height, 'obstacle')) {
            this.coordinates = coordinates;
            this.flyElm.style.transform = `translate(${this.coordinates.x}px, ${this.coordinates.y}px)`;
        }
    }

    reachedExit(coordinates = this.coordinates) {
        return this.world.isElementAtExit(coordinates, this.width, this.height);
    }

    getIsFree() {
        return this.isFree;
    }
}

export default Fly;