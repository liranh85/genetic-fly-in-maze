class Fly {
    constructor(settings) {
        this.elmId = settings.elmId;
        this.interval = settings.interval;
        this.defaultInterval = settings.interval;
        this.width = settings.width;
        this.height = settings.height;
        this.flightDistance = settings.flightDistance;
        this.world = settings.world;
        this.coordinates = {
            x: 0,
            y: 0
        }
        this.flyElm;
        this.isFree = false;
        this.locationHistory = [];
        this.autoPilotInterval = null;
        this.autoPilotPromise = null;
        this.transitionDurationUnit = 'ms';
        this.keepAutoPilotIntervalRunning = true;
        this._init();
    }

    _init() {
        this._createFlyElement();
        document.addEventListener('change-fly-speed', (e) => {
            this.interval = e.detail;
            this._setTransitionDuration();
        });
    }

    _setTransitionDuration() {
        this.flyElm.style.transitionDuration = `${this.interval}${this.transitionDurationUnit}`;
    }

    _createFlyElement() {
        this.flyElm = document.createElement('div');
        this.flyElm.id = this.elmId;
        this.flyElm.setAttribute('class', 'fly');
        this.flyElm.style.width = `${this.width}px`;
        this.flyElm.style.height = `${this.height}px`;
        this._setTransitionDuration();
        this.world.worldElm.appendChild(this.flyElm);
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

    _getRandomDirection() {
        const rand = Math.random();
        if (rand <= 0.333) {
            return 'up';
        }
        if (rand <= 0.666) {
            return 'down';
        }
        return 'forward';
    }

    _addDirectionToLocationHistory(direction) {
        switch (direction) {
            case 'up':
                this.locationHistory.push(0);
                break;
            case 'down':
                this.locationHistory.push(1);
                break;
            default:
                this.locationHistory.push(2);
                break;
        }
    }

    _parseDirection(direction) {
        switch(direction) {
            case 0:
                return 'up';
            case 1:
                return 'down';
            case 2:
                return 'forward';
        }
    }

    _fittestFoundHandler() {
        this.keepAutoPilotIntervalRunning = false;
        this.flyElm.removeEventListener('fittest-found', this._fittestFoundHandler);
        this.flyElm.remove();
        this.autoPilotPromise.reject && this.autoPilotPromise.reject();
    };

    autoPilot(directions = null) {
        this.flyElm.addEventListener('fittest-found', this._fittestFoundHandler.bind(this));

        this.autoPilotPromise = new Promise((resolve, reject) => {
            const autoPilotInterval = () => {
                const direction = (directions && directions.length) ? this._parseDirection(directions.shift()) : this._getRandomDirection();
                this._addDirectionToLocationHistory(direction);
                this.flyTo(direction);
                if (this.isFree) {
                    this.keepAutoPilotIntervalRunning = false;
                    this.flyElm.removeEventListener('fittest-found', this._fittestFoundHandler);
                    this.flyElm.remove();
                    resolve(this.locationHistory);
                }

                if (this.keepAutoPilotIntervalRunning) {
                    window.setTimeout(autoPilotInterval, this.interval);
                }
            }

            autoPilotInterval();
        });

        return this.autoPilotPromise;
    }

    flyTo(direction) {
        if(this.isFree) {
            return;
        }
        let coordinates = this._getNewCoordinates(direction);
        if (this.reachedExit(coordinates)) {
            this.isFree = true;
            this.coordinates.x += 50;
            this.flyElm.style.transitionDuration = '2s';
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