import Genetic from './Genetic';
import World from './World';
import Fly from './Fly';

class GeneticFlyInMaze {
    constructor() {
        this.trainingData;
        this.startStopElm = document.getElementById('start-stop');
        this.replayElm = document.getElementById('replay');
        this.onReplayClickedBound;
        this.settings = {};
        this.initFunction = this.initFunction.bind(this);
        this.seed = this.seed.bind(this);
        this.mutate = this.mutate.bind(this);
        this.crossover = this.crossover.bind(this);
        this.fitness = this.fitness.bind(this);
        this.notification = this.notification.bind(this);
        this.isFinished = this.isFinished.bind(this);
        this.onFinished = this.onFinished.bind(this);
        this.updateSpeedInView = this.updateSpeedInView.bind(this);
        this.onPauseClicked = this.onPauseClicked.bind(this);
        this.world = new World({
            width: 600,
            height: 350,
            elmId: 'maze'
        });
        this.flySettings = {
            width: 25,
            height: 25,
            flightDistance: 15,
            world: this.world,
            interval: 0
        };
        this.seedsUsed;
        this.userData = {
            populationSize: 20,
            interval: 0,
            minInterval: 0,
            maxInterval: 1000,
            intervalIncrementPercentage: 5,
        };
        this.userData.defaultInterval = this.userData.interval;
        this.DOMElements = {
            slowDownButton: document.getElementById('slow-down'),
            speedUpButton: document.getElementById('speed-up'),
            resetSpeedButton: document.getElementById('reset-speed'),
            speedValueButton: document.getElementById('speed-value'),
            generationTableHeaderRow: document.getElementById('generation-table-header-row'),
            bestFitness: document.getElementById('best-fitness'),
            bestFitnessGeneration: document.getElementById('best-fitness-generation')
        };
    }

    init() {
        const flies = [];
        for (let i = 0; i < this.userData.populationSize; i++) {
            flies.push(new Fly({
                ...this.flySettings,
                ... {
                    elmId: `fly${i}`
                }
            }));
        }

        const promises = [];

        flies.forEach((fly) => {
            promises.push( fly.autoPilot() );
        });

        Promise.all(promises).then((trainingData) => {
            this.trainingData = trainingData;
            this._ready();
        });
    }

    _ready() {
        const startClicked = () => {
            this.startStopElm.removeEventListener('click', boundStartClicked);
            this._run();
        }

        this.startStopElm.disabled = false;
        const boundStartClicked = startClicked.bind(this);
        this.startStopElm.addEventListener('click', boundStartClicked);
    }

    seed() {
        const seed = this.trainingData[this.seedsUsed];
        if (++this.seedsUsed >= this.trainingData.length) {
            this.seedsUsed = 0;
        }
        return seed;
    };

    mutate(entity, iterations = 1) {
        const mutated = entity.slice();
        for(let i = 0; i < iterations; i++) {
            let index = Math.floor(Math.random() * entity.length);
            let plusOrMinusOne = Math.floor(Math.random()*2) ? 1 : -1;
            mutated[index] = (mutated[index] + 3 + plusOrMinusOne) % 3;
        }
        return mutated;
    };

    crossover(mother, father) {
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

    async fitness(DNA, entityId = 'entity0', interval = this.userData.interval) {
        const fly = new Fly({
            ...this.flySettings,
            ... {
                elmId: entityId,
                interval
            }
        });
        let fitness;

        try {
            const locationHistory = await fly.autoPilot(DNA.slice());
            fitness = locationHistory.length;
        }
        catch(e) {
            fitness = 1000000;
        }
        return fitness;
    };

    notification(stats) {
        const updateFittestEverInView = () => {
            this.DOMElements.bestFitness.innerHTML = stats.fittestEver.fitness;
            this.DOMElements.bestFitnessGeneration.innerHTML = stats.generation;
            this.DOMElements.bestFitness.style.display = 'none';
            setTimeout(() => {
                this.DOMElements.bestFitness.style.display = 'inline-block';
            }, 0);
        };

        const row = document.createElement('tr');
        row.classList.add('data-row');
        const generationCell = document.createElement('td');
        generationCell.innerHTML = stats.generation;
        const meanCell = document.createElement('td');
        meanCell.innerHTML = stats.mean;
        const fitnessesCell = document.createElement('td');
        stats.population.forEach((entity, i) => {
            const fitness = entity.fitness === this.settings.config.initialFitness ?
                'X' :
                entity.fitness;
            const fitnessHTML = i < this.settings.config.numberOfFittestToSelect ?
            `, <strong>${fitness}</strong>` :
            `, ${fitness}`;
            fitnessesCell.innerHTML += fitnessHTML;
        });
        fitnessesCell.innerHTML = fitnessesCell.innerHTML.substring(2);
        row.appendChild(generationCell);
        row.appendChild(meanCell);
        row.appendChild(fitnessesCell);
        this.DOMElements.generationTableHeaderRow.parentNode.insertBefore(row, this.DOMElements.generationTableHeaderRow.nextSibling);
        if (stats.fittestEver.generation === stats.generation) {
            updateFittestEverInView();
        }
    };

    onPauseClicked() {
        const pauseElm = this.settings.config.pauseElm;
        pauseElm.innerHTML = (pauseElm.innerHTML === 'Pause' ? 'Resume' : 'Pause');
        pauseElm.classList.toggle('paused');
    };

    isFinished(stats) {
        return stats.generation >= 500;
    }

    onFinished(stats) {
        this.settings.config.pauseElm.disabled = true;
        if(this.settings.config.pauseElm.classList.contains('paused')) {
            this.onPauseClicked();
        }
        this.settings.config.stopElm.innerHTML = 'Start';
        this.settings.config.stopElm.classList.remove('started');
        this.replayElm.classList.remove('hidden');
        this.onReplayClickedBound = onReplayClicked.bind(this, stats);
        this.replayElm.addEventListener('click', this.onReplayClickedBound);
        this._ready();

        function onReplayClicked() {
            this.userData.interval = this.userData.maxInterval * 0.2;
            this.updateSpeedInView();
            this.settings.geneticFunctions.fitness(stats.fittestEver.DNA, 'fittest', this.userData.interval);
        }
    };

    updateSpeedInView() {
        document.getElementById('speed-value').innerHTML = `${(100 - this.userData.interval / (this.userData.maxInterval / 100)).toFixed(0)}%`;
    };

    initFunction() {
        const userData = this.userData;

        const setupUIElements = () => {
            this.updateSpeedInView();
            this.DOMElements.slowDownButton.disabled = false;
            this.DOMElements.resetSpeedButton.disabled = false;
            this.DOMElements.speedUpButton.disabled = false;
            this.settings.config.pauseElm.disabled = false;
            this.settings.config.pauseElm.removeEventListener('click', this.onPauseClicked);
            this.startStopElm.classList.add('started');
            this.startStopElm.innerHTML = 'Stop';
            this.replayElm.classList.add('hidden');
            if (this.onReplayClickedBound) {
                this.replayElm.removeEventListener('click', this.onReplayClickedBound);
            }
        };

        const resetNotificationTable = () => {
            const dataRows = document.querySelectorAll('#generation-table .data-row');
            for(let i = 0; i < dataRows.length; i++) {
                dataRows[i].parentElement.removeChild(dataRows[i]);
            }
        };

        const addEventListeners = () => {
            this.settings.config.pauseElm.addEventListener('click', this.onPauseClicked);
            this.DOMElements.slowDownButton.addEventListener('click', () => {
                userData.interval += intervalIncrement;
                if (userData.interval > userData.maxInterval) {
                    userData.interval = userData.maxInterval;
                }
                dispatchFlySpeedEvent();
                this.updateSpeedInView();
            });
            this.DOMElements.speedUpButton.addEventListener('click', () => {
                const suggestedInterval = userData.interval - intervalIncrement;
                userData.interval = suggestedInterval > 0 ? suggestedInterval : userData.minInterval;
                dispatchFlySpeedEvent();
                this.updateSpeedInView();
            });
            this.DOMElements.resetSpeedButton.addEventListener('click', () => {
                userData.interval = userData.defaultInterval;
                dispatchFlySpeedEvent();
                this.updateSpeedInView();
            });
        };

        const dispatchFlySpeedEvent = () => {
            const event = new CustomEvent('change-fly-speed', { detail: userData.interval });
            document.dispatchEvent(event);
        };

        this.seedsUsed = 0;
        const intervalIncrement = userData.maxInterval / 100 * userData.intervalIncrementPercentage;
        setupUIElements();
        resetNotificationTable();
        addEventListeners();
    };

    _run() {
        this.settings = {
            initFunction: this.initFunction,
            geneticFunctions: {
                seed: this.seed,
                mutate: this.mutate,
                crossover: this.crossover,
                fitness: this.fitness,
                notification: this.notification
            },
            config: {
                size: this.userData.populationSize,
                mutationIterations: 5,
                skip: 0,
                optimise: 'min',
                initialFitness: 1111,
                numberOfFittestToSelect: 4,
                killTheWeak: true,
                pauseElm: document.getElementById('pause'),
                stopElm: this.startStopElm
            },
            isFinished: this.isFinished,
            onFinished: this.onFinished
        };

        const genetic = new Genetic(this.settings);

		genetic.evolve();
    }
}

export default GeneticFlyInMaze;