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
            if (++this.userData.seedsUsed >= this.userData.trainingData.length) {
                this.userData.seedsUsed = 0;
            }
            return seed;
        };

        const mutate = function(entity, iterations = 1) {
            const mutated = entity.slice();
            for(let i = 0; i < iterations; i++) {
                let index = Math.floor(Math.random() * entity.length);
                let plusOrMinusOne = Math.floor(Math.random()*2) ? 1 : -1;
                mutated[index] = (mutated[index] + 3 + plusOrMinusOne) % 3;
            }
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

            const son = father.slice(0, ca).concat(mother.slice(ca, cb), father.slice(cb));
            const daughter = mother.slice(0, ca).concat(father.slice(ca, cb), mother.slice(cb));

            return [son, daughter];
        };

        const fitness = async function(entity, entityId = 0) {
            const fly = new this.userData.Fly({
                elmId: entityId,
                interval: this.userData.interval,
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

        const notification = function(stats) {
            const generationTableHeaderRow = document.getElementById('generation-table-header-row');
            const row = document.createElement('tr');
            const generationCell = document.createElement('td');
            generationCell.innerHTML = stats.generation;
            const meanCell = document.createElement('td');
            meanCell.innerHTML = stats.mean;
            const fitnessesCell = document.createElement('td');
            stats.population.forEach((individual, i) => {
                const fitness = individual.fitness === this.config.initialFitness ?
                    'X' :
                    individual.fitness;
                const fitnessHTML = i < this.config.numberOfFittestToSelect ?
                `, <strong>${fitness}</strong>` :
                `, ${fitness}`;
                fitnessesCell.innerHTML += fitnessHTML;
            });
            fitnessesCell.innerHTML = fitnessesCell.innerHTML.substring(2);
            row.appendChild(generationCell);
            row.appendChild(meanCell);
            row.appendChild(fitnessesCell);
            generationTableHeaderRow.parentNode.insertBefore(row, generationTableHeaderRow.nextSibling);
            if (stats.fittestEver.generation === stats.generation) {
                updateFittestEverInView();
            }

            function updateFittestEverInView() {
                const bestFitness = document.getElementById('best-fitness');
                const bestFitnessGeneration = document.getElementById('best-fitness-generation');
                bestFitness.innerHTML = stats.fittestEver.fitness;
                bestFitnessGeneration.innerHTML = stats.generation;
                bestFitness.style.display = 'none';
                setTimeout(() => {
                    bestFitness.style.display = 'inline-block';
                }, 0);
            }
        };

        const addEventListeners = function() {
            document.getElementById('slow-down').addEventListener('click', () => {
                this.userData.interval += 10;
            });
            document.getElementById('speed-up').addEventListener('click', () => {
                this.userData.interval = this.userData.interval - 10 || 0;
            });
            document.getElementById('reset-speed').addEventListener('click', () => {
                this.userData.interval = this.userData.defaultInterval;
            });
        }

        const settings = {
            initFunction: addEventListeners,
            geneticFunctions: {
                seed,
                mutate,
                crossover,
                fitness,
                generation,
                notification
            },
            config: {
                iterations: 1000,
                size: this.trainingData.length,
                mutationIterations: 5,
                skip: 0,
                optimise: 'min',
                initialFitness: 1111,
                numberOfFittestToSelect: 4,
                killTheWeak: true
            },
            userData: {
                trainingData: this.trainingData.slice(),
                seedsUsed: 0,
                Fly: Fly,
                world: new World({
                    width: 600,
                    height: 350,
                    elmId: 'maze'
                }),
                interval: 0,
                defaultInterval: 0
            }
        };

        const genetic = new Genetic(settings);

		genetic.evolve();
    }
}

export default GeneticFlyInMaze;