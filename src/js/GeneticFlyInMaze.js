import Genetic from 'genetic-lib';
import World from './World';
import Fly from './Fly';
import Draggabilly from 'draggabilly';

class GeneticFlyInMaze {
    constructor() {
        this.trainingData;
        this.startStopElm = document.getElementById('start-stop');
        this.replayElm = document.getElementById('replay');
        this.onReplayClickedBound;
        this.settings = {};
        this._initFunction = this._initFunction.bind(this);
        this._seed = this._seed.bind(this);
        this._mutate = this._mutate.bind(this);
        this._crossover = this._crossover.bind(this);
        this._fitness = this._fitness.bind(this);
        this._notification = this._notification.bind(this);
        this._isFinished = this._isFinished.bind(this);
        this._onFinished = this._onFinished.bind(this);
        this._updateSpeedInView = this._updateSpeedInView.bind(this);
        this._onPauseClicked = this._onPauseClicked.bind(this);
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
        this.NUM_POSSIBLE_DIRECTIONS = 3;
        this.DOMElements = {
            mazeWrapper: document.getElementById('maze-wrapper'),
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
        this.DOMElements.mazeWrapper.classList.add('training');
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
            this.DOMElements.mazeWrapper.classList.remove('training');
            this.DOMElements.mazeWrapper.classList.add('ready');
            window.setTimeout(() => {
                this.DOMElements.mazeWrapper.classList.remove('ready');
            }, 1500);
            this._ready();
        });
    }

    _initDraggable() {
        const draggableElms = document.getElementsByClassName('draggable');
        const draggies = [];
        for (let i = 0; i < draggableElms.length; i++) {
            draggies.push(new Draggabilly(draggableElms[i], {
                containment: '.maze'
            }));
        }
    }

    _ready() {
        const startClicked = () => {
            this.startStopElm.removeEventListener('click', boundStartClicked);
            this._run();
        }

        this.startStopElm.disabled = false;
        const boundStartClicked = startClicked.bind(this);
        this.startStopElm.addEventListener('click', boundStartClicked);
        this._initDraggable();
    }

    _seed() {
        const seed = this.trainingData[this.seedsUsed];
        if (++this.seedsUsed >= this.trainingData.length) {
            this.seedsUsed = 0;
        }
        return seed;
    }

    _mutate(DNA) {
        const mutated = DNA.slice();
        let index = Math.floor(Math.random() * DNA.length);
        let plusOrMinusOne = Math.floor(Math.random()*2) ? 1 : -1;
        mutated[index] = (mutated[index] + this.NUM_POSSIBLE_DIRECTIONS + plusOrMinusOne) % this.NUM_POSSIBLE_DIRECTIONS;
        return mutated;
    }

    _crossover(mother, father) {
        // two-point crossover
        const length = mother.length;
        let ca = Math.floor(Math.random() * length);
        let cb = Math.floor(Math.random() * length);
        if (ca > cb) {
            let tmp = cb;
            cb = ca;
            ca = tmp;
        }

        const son = father.slice(0, ca).concat(mother.slice(ca, cb), father.slice(cb));
        const daughter = mother.slice(0, ca).concat(father.slice(ca, cb), mother.slice(cb));

        return [son, daughter];
    }

    async _fitness(DNA, entityId = 'entity0', interval = this.userData.interval) {
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
    }

    _notification(stats) {
        const updateFittestEverInView = () => {
            this.DOMElements.bestFitness.innerHTML = stats.fittestEver.fitness;
            this.DOMElements.bestFitnessGeneration.innerHTML = stats.fittestEver.generation;
            this.DOMElements.bestFitness.style.display = 'none';
            setTimeout(() => {
                this.DOMElements.bestFitness.style.display = 'inline-block';
            }, 0);
        };

        this._killTheWeak(stats.population);
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
        if (stats.fittestEver.generation <= stats.generation && stats.fittestEver.generation > stats.generation - this.settings.config.skip) {
            updateFittestEverInView();
        }
    }

    _onPauseClicked() {
        const pauseElm = this.settings.config.pauseElm;
        pauseElm.innerHTML = (pauseElm.innerHTML === 'Pause' ? 'Resume' : 'Pause');
        pauseElm.classList.toggle('paused');
    }

    _isFinished(stats) {
        return stats.generation >= 500;
    }

    _onFinished(stats) {
        this.settings.config.pauseElm.disabled = true;
        if(this.settings.config.pauseElm.classList.contains('paused')) {
            this._onPauseClicked();
        }
        this.settings.config.stopElm.innerHTML = 'Start';
        this.settings.config.stopElm.classList.remove('started');
        this.replayElm.classList.remove('hidden');
        this.onReplayClickedBound = onReplayClicked.bind(this, stats);
        this.replayElm.addEventListener('click', this.onReplayClickedBound);
        this._ready();

        function onReplayClicked() {
            this.userData.interval = this.userData.maxInterval * 0.2;
            this._updateSpeedInView();
            this.settings.geneticFunctions.fitness(stats.fittestEver.DNA, 'fittest', this.userData.interval);
        }
    }

    _killTheWeak(population) {
        for (let i = 0; i < population.length; i++) {
            document.getElementById(`entity${i}`) && document.getElementById(`entity${i}`).dispatchEvent(new CustomEvent('fittest-found'));
        }
    }

    _updateSpeedInView() {
        document.getElementById('speed-value').innerHTML = `${(100 - this.userData.interval / (this.userData.maxInterval / 100)).toFixed(0)}%`;
    }

    _initFunction() {
        const userData = this.userData;

        const setupUIElements = () => {
            this._updateSpeedInView();
            this.DOMElements.slowDownButton.disabled = false;
            this.DOMElements.resetSpeedButton.disabled = false;
            this.DOMElements.speedUpButton.disabled = false;
            this.settings.config.pauseElm.disabled = false;
            this.settings.config.pauseElm.removeEventListener('click', this._onPauseClicked);
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
            this.settings.config.pauseElm.addEventListener('click', this._onPauseClicked);
            this.DOMElements.slowDownButton.addEventListener('click', () => {
                userData.interval += intervalIncrement;
                if (userData.interval > userData.maxInterval) {
                    userData.interval = userData.maxInterval;
                }
                dispatchFlySpeedEvent();
                this._updateSpeedInView();
            });
            this.DOMElements.speedUpButton.addEventListener('click', () => {
                const suggestedInterval = userData.interval - intervalIncrement;
                userData.interval = suggestedInterval > 0 ? suggestedInterval : userData.minInterval;
                dispatchFlySpeedEvent();
                this._updateSpeedInView();
            });
            this.DOMElements.resetSpeedButton.addEventListener('click', () => {
                userData.interval = userData.defaultInterval;
                dispatchFlySpeedEvent();
                this._updateSpeedInView();
            });
        };

        const dispatchFlySpeedEvent = () => {
            const event = new CustomEvent('change-fly-speed', { detail: userData.interval });
            document.dispatchEvent(event);
        };

        this.seedsUsed = 0;
        this.userData.interval = this.userData.defaultInterval;
        const intervalIncrement = userData.maxInterval / 100 * userData.intervalIncrementPercentage;
        setupUIElements();
        resetNotificationTable();
        addEventListeners();
    }

    _run() {
        this.settings = {
            initFunction: this._initFunction,
            geneticFunctions: {
                seed: this._seed,
                mutate: this._mutate,
                crossover: this._crossover,
                fitness: this._fitness,
                notification: this._notification
            },
            config: {
                size: this.userData.populationSize,
                mutationIterations: 5,
                skip: 1,
                optimise: 'min',
                initialFitness: 1111,
                numberOfFittestToSelect: 4,
                killTheWeak: true,
                pauseElm: document.getElementById('pause'),
                stopElm: this.startStopElm
            },
            isFinished: this._isFinished,
            onFinished: this._onFinished
        };

        const genetic = new Genetic(this.settings);

		genetic.solve();
    }
}

export default GeneticFlyInMaze;