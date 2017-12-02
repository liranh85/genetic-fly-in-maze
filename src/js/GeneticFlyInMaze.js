import Genetic from 'genetic-js';
import World from './World';
import Fly from './Fly';

class GeneticFlyInMaze {
    constructor(trainingData) {
        this.trainingData = trainingData;
        this.solve = this.solve.bind(this);
    }

    solve() {
        const genetic = Genetic.create();

        genetic.optimize = Genetic.Optimize.Minimize;
        genetic.select1 = Genetic.Select1.Tournament2;
        genetic.select2 = Genetic.Select2.Tournament2;

        genetic.seed = function() {
            const seed = this.userData.trainingData[this.userData.seedsUsed];
            this.userData.seedsUsed++;
            if (this.userData.seedsUsed >= this.userData.trainingData.length) {
                this.userData.seedsUsed = 0;
            }
            return seed;
        };

        genetic.mutate = function(entity) {
            const mutated = entity.slice();
            const i = Math.floor(Math.random() * entity.length);
            const plusOrMinusOne = Math.floor(Math.random()*2) ? 1 : -1;
            mutated[i] = (mutated[i] + plusOrMinusOne) % 3;
            return mutated;
        };

        genetic.crossover = function(mother, father) {
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

        genetic.fitness = async function(entity) {
            const fly = new this.userData.Fly({
                elmId: 'fly1',
                interval: 10,
                width: 25,
                height: 25,
                flightDistance: 15,
                world: this.userData.world
            });
            let fitness;

            try {
                const locationHistory = await fly.autoPilot(entity);
                fitness = locationHistory.length;
            }
            catch(e) {
                fitness = 1000000;
            }

            return fitness;
        };

        genetic.generation = (pop, generation, stats) => generation === 10000;

        genetic.notification = function(pop, generation, stats, isFinished) {
            console.log('pop', pop);
            console.log('generation', generation);
            console.log('stats', stats);
            console.log('isFinished', isFinished);
        }

        const config = {
            iterations: 4000,
            size: this.trainingData.length,
            crossover: 0.3,
            mutation: 0.3,
            skip: 20
        };

        const userData = {
            trainingData: this.trainingData.slice(),
            seedsUsed: 0,
            Fly: Fly,
            world: new World({
                width: 600,
                height: 350,
                elmId: 'maze'
            })
        }

		genetic.evolve(config, userData);
    }
}

export default GeneticFlyInMaze;