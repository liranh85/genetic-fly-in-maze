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

        const notification = function(stats) {
            const updateFittestEverInView = () => {
                this.userData.DOMElements.bestFitness.innerHTML = stats.fittestEver.fitness;
                this.userData.DOMElements.bestFitnessGeneration.innerHTML = stats.generation;
                this.userData.DOMElements.bestFitness.style.display = 'none';
                setTimeout(() => {
                    this.userData.DOMElements.bestFitness.style.display = 'inline-block';
                }, 0);
            };

            const row = document.createElement('tr');
            const generationCell = document.createElement('td');
            generationCell.innerHTML = stats.generation;
            const meanCell = document.createElement('td');
            meanCell.innerHTML = stats.mean;
            const fitnessesCell = document.createElement('td');
            stats.population.forEach((entity, i) => {
                const fitness = entity.fitness === this.config.initialFitness ?
                    'X' :
                    entity.fitness;
                const fitnessHTML = i < this.config.numberOfFittestToSelect ?
                `, <strong>${fitness}</strong>` :
                `, ${fitness}`;
                fitnessesCell.innerHTML += fitnessHTML;
            });
            fitnessesCell.innerHTML = fitnessesCell.innerHTML.substring(2);
            row.appendChild(generationCell);
            row.appendChild(meanCell);
            row.appendChild(fitnessesCell);
            this.userData.DOMElements.generationTableHeaderRow.parentNode.insertBefore(row, this.userData.DOMElements.generationTableHeaderRow.nextSibling);
            if (stats.fittestEver.generation === stats.generation) {
                updateFittestEverInView();
            }
        };

        const initFunction = function() {
            const storeDOMElementsInUserData = () => {
                this.userData.DOMElements = {};
                this.userData.DOMElements.slowDownButton = document.getElementById('slow-down');
                this.userData.DOMElements.speedUpButton = document.getElementById('speed-up');
                this.userData.DOMElements.resetSpeedButton = document.getElementById('reset-speed');
                this.userData.DOMElements.speedValueButton = document.getElementById('speed-value');
                this.userData.DOMElements.generationTableHeaderRow = document.getElementById('generation-table-header-row');
                this.userData.DOMElements.bestFitness = document.getElementById('best-fitness');
                this.userData.DOMElements.bestFitnessGeneration = document.getElementById('best-fitness-generation');
            };

            const unblockUIElements = () => {
                this.userData.DOMElements.slowDownButton.disabled = false;
                this.userData.DOMElements.speedUpButton.disabled = false;
                this.userData.DOMElements.resetSpeedButton.disabled = false;
            };

            const addEventListeners = () => {
                this.userData.DOMElements.slowDownButton.addEventListener('click', () => {
                    this.userData.interval += intervalIncrement;
                    if (this.userData.interval > this.userData.maxInterval) {
                        this.userData.interval = this.userData.maxInterval;
                    }
                    dispatchFlySpeedEvent();
                    updateSpeedInView();
                });
                this.userData.DOMElements.speedUpButton.addEventListener('click', () => {
                    const suggestedInterval = this.userData.interval - intervalIncrement;
                    this.userData.interval = suggestedInterval > 0 ? suggestedInterval : this.userData.minInterval;
                    dispatchFlySpeedEvent();
                    updateSpeedInView();
                });
                this.userData.DOMElements.resetSpeedButton.addEventListener('click', () => {
                    this.userData.interval = this.userData.defaultInterval;
                    dispatchFlySpeedEvent();
                    updateSpeedInView();
                });
            };

            const dispatchFlySpeedEvent = () => {
                const event = new CustomEvent('change-fly-speed', { detail: this.userData.interval });
                document.dispatchEvent(event);
            };

            const updateSpeedInView = () => {
                document.getElementById('speed-value').innerHTML = `${(100 - this.userData.interval / (this.userData.maxInterval / 100)).toFixed(0)}%`;
            };

            storeDOMElementsInUserData();
            const intervalIncrement = this.userData.maxInterval / 100 * this.userData.intervalIncrementPercentage;
            unblockUIElements();
            addEventListeners();
        }

        const settings = {
            initFunction,
            geneticFunctions: {
                seed,
                mutate,
                crossover,
                fitness,
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
                defaultInterval: 0,
                minInterval: 0,
                maxInterval: 1000,
                intervalIncrementPercentage: 5
            }
        };

        const genetic = new Genetic(settings);

		genetic.evolve();
    }
}

export default GeneticFlyInMaze;