import World from './World';
import Fly from './Fly';
import { setInterval } from 'timers';

const appSettings = {
    stopOnFirstFlyOut: false
}

const world = new World({
    width: 600,
    height: 350,
    elmId: 'maze'
});

const flies = [];
const flySettings = {
    // interval: 500,
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
            elmId: `fly${i}`,
            interval: Math.floor(100 * Math.random())
        }
    }));
}

flies.forEach((fly) => {
    fly.autoPilot();
});