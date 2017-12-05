import World from './World';
import Fly from './Fly';
import GeneticFlyInMaze from './GeneticFlyInMaze';

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
    width: 25,
    height: 25,
    flightDistance: 15,
    world: world,
    interval: 0
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

const promises = [];

flies.forEach((fly) => {
    promises.push( fly.autoPilot() );
});

Promise.all(promises).then(trainingData => {
    const geneticFlyInMaze = new GeneticFlyInMaze(trainingData);
    geneticFlyInMaze.solve();
})