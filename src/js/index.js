import World from './World';
import Fly from './Fly';

const appSettings = {
    stopOnFirstFlyOut: false
}

function getRandomDirection() {
    const rand = Math.random();
    if (rand <= 0.333) {
        return 'up';
    }
    if (rand <= 0.666) {
        return 'down';
    }
    return 'forward';
}

const world = new World({
    width: 600,
    height: 350,
    elmId: 'maze'
});

const flies = [];
const flySettings = {
    interval: 100,
    width: 25,
    height: 25,
    flightDistance: 15,
    world: world
}
const numFlies = 20;

for (let i = 0; i < numFlies; i++) {
    flies.push(new Fly({
        ...flySettings,
        ... {
            elmId: `fly${i}`
        }
    }));
}

let interval = window.setInterval(() => {
    let numFreeFlies = 0;
    flies.forEach((fly) => {
        fly.flyTo(getRandomDirection());
        
        if (fly.getIsFree()) {
            if (appSettings.stopOnFirstFlyOut) {
                clearInterval(interval);
            }
            else {
                numFreeFlies++;
            }
        }
    });
    if (numFreeFlies === numFlies) {
        clearInterval(interval);
    }
}, flySettings.interval);