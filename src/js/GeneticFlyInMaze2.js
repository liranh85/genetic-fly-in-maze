import Genetic from './Genetic';
import World from './World';
import Fly from './Fly';

class GeneticFlyInMaze {
    constructor(trainingData) {
        this.trainingData = trainingData;
        this.solve = this.solve.bind(this);
    }

    solve() {
        const seed = function() {
            const seed = this.userData.trainingData[this.userData.seedsUsed];
            this.userData.seedsUsed++;
            if (this.userData.seedsUsed >= this.userData.trainingData.length) {
                this.userData.seedsUsed = 0;
            }
            return seed;
        };

        const mutate = function(entity) {
            const mutated = entity.slice();
            const i = Math.floor(Math.random() * entity.length);
            const plusOrMinusOne = Math.floor(Math.random()*2) ? 1 : -1;
            mutated[i] = (mutated[i] + plusOrMinusOne) % 3;
            return mutated;
        };

        const crossover = function(mother, father) {
            // two-point crossover
            const len = mother.length;
            let ca = Math.floor(Math.random()*len);
            let cb = Math.floor(Math.random()*len);
            if (ca > cb) {
                let tmp = cb;
                cb = ca;
                ca = tmp;
            }

            const son = father.slice(0, ca) + mother.slice(ca, cb) + father.slice(cb);
            const daughter = mother.slice(0, ca) + father.slice(ca, cb) + mother.slice(cb);

            return [son, daughter];
        };

        const fitness = async function(entity, entityId = 0) {
            const fly = new this.userData.Fly({
                elmId: `fly${entityId}`,
                interval: 10,
                width: 25,
                height: 25,
                flightDistance: 15,
                world: this.userData.world
            });
            let fitness;

            try {
                const locationHistory = await fly.autoPilot(entity.slice());
                fitness = locationHistory.length;
            }
            catch(e) {
                fitness = 1000000;
            }

            return fitness;
        };

        const generation = (pop, generation, stats) => generation === 10000;

        // const notification = function(pop, generation, stats, isFinished) {
        const notification = function(fittest) {
            // console.log('pop', pop);
            // console.log('generation', generation);
            // console.log('stats', stats);
            // console.log('isFinished', isFinished);
            console.log('fittest', fittest);
        };

        const settings = {
            geneticFunctions: {
                seed,
                mutate,
                crossover,
                fitness,
                generation,
                notification
            },
            config: {
                iterations: 100,
                size: this.trainingData.length,
                crossover: 0.3,
                mutation: 0.3,
                skip: 20,
                optimise: 'min',
            },
            userData: {
                trainingData: this.trainingData.slice(),
                seedsUsed: 0,
                Fly: Fly,
                world: new World({
                    width: 600,
                    height: 350,
                    elmId: 'maze'
                })
            }
        };

        const genetic = new Genetic(settings);

		genetic.evolve();
    }
}

export default GeneticFlyInMaze;