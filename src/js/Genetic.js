class Genetic {
    constructor(settings) {
        this.seed = settings.geneticFunctions.seed;
        this.mutate = settings.geneticFunctions.mutate;
        this.crossover = settings.geneticFunctions.crossover;
        this.fitness = settings.geneticFunctions.fitness;
        this.generation = settings.geneticFunctions.generation;
        this.notification = settings.geneticFunctions.notification;
        this.config = settings.config;
        this.userData = settings.userData;
        this.population = this._clone(this.userData.trainingData);
        this.currentGeneration;
        this._init();
    }

    _init() {
        if (!this.config.numberOfFittestToSelect) {
            // Default value is 2 if not set
            this.config.numberOfFittestToSelect = 2;
        } else if (this.config.numberOfFittestToSelect % 2 !== 0) {
            // Must be an even number
            this.config.numberOfFittestToSelect++;
        }
    }

    async evolve() {
        for (this.currentGeneration = 0; this.currentGeneration < this.config.iterations; this.currentGeneration++) {
            this._initPopulation();

            try {
                await this._computePopulationFitness();
            }
            catch(e) {
                console.error(e);
                return;
            }
            if (this.config.killTheWeak) {
                this._killTheWeak();
            }
            this._sortGenesByFittest();
            this.notification(this.stats());
            // This will apply both crossover and mutation
            this._createNewGeneration();
        }
    }

    _initPopulation() {
        // Not implementing seeding for now, as I already have the training data.
        this.population = this.population.map((gene) => {
            return {
                gene,
                fitness: this.config.initialFitness
            };
        });
    }

    _computePopulationFitness() {
        let resolvedPromisesNum = 0;
        return new Promise((resolve, reject) => {
            this.population.forEach((individual, i) => {
                this.fitness(individual.gene, i).then((response) => {
                    individual.fitness = response;
                    resolvedPromisesNum++;
                    if ((this.config.killTheWeak && resolvedPromisesNum === this.config.numberOfFittestToSelect) || resolvedPromisesNum === this.population.length) {
                        resolve();
                    }
                });
            });
        });
    }

    _killTheWeak() {
        for (let i = 0; i < this.population.length; i++) {
            document.getElementById(i) && document.getElementById(i).dispatchEvent(new CustomEvent('fittest-found'));
        }
    }

    _sortGenesByFittest() {
        this.population.sort((a, b) => {
            let sort = b.fitness - a.fitness;
            if (this.config.optimise === 'min') {
                sort *= -1;
            }
            return sort;
        });
    }

    _createNewGeneration() {
        const createAndAddNewborns = (gene1, gene2) => {
            let newborns = this.crossover(gene1, gene2);
            newborns[0] = this.mutate(newborns[0], this.config.mutationIterations);
            newborns[1] = this.mutate(newborns[1], this.config.mutationIterations);
            this.population.push(newborns[0], newborns[1]);
        };

        this.oldGeneration = this._clone(this.population);
        this.population = [];
        for (let i = 0; i < this.config.size / this.config.numberOfFittestToSelect; i++) {
            for (let j = 0; j < this.config.numberOfFittestToSelect; j+= this.config.numberOfFittestToSelect / 2) {
                createAndAddNewborns(this.oldGeneration[j].gene, this.oldGeneration[j + 1].gene);
            }
        }
    }

    _clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    meanFitness() {
        const fittest = this.population.slice(0, this.config.numberOfFittestToSelect);
        return fittest.reduce((accumulator, currentValue) => {
            return accumulator + currentValue.fitness;
        }, 0) / fittest.length;
    }

    stats() {
        return {
            population: this._clone(this.population),
            generation: this.currentGeneration,
            mean: this.meanFitness(),
            isFinished: this.currentGeneration === this.config.iterations
        }
    }
}

export default Genetic;