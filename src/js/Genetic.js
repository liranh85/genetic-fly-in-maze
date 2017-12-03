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
        this.population = JSON.parse(JSON.stringify(this.userData.trainingData));
    }

    async evolve() {
        // TO DO: Loop around these
        for (let i = 0; i < this.config.iterations; i++) {
            // console.log('Training data', this.userData.trainingData);
            this._initPopulation();

            try {
                await this._computePopulationFitness();
            }
            catch(e) {
                console.error(e);
                return;
            }
            const fittest = this._selectFittestGenes();
            // This will apply both crossover and mutation
            // this.notification(this.population, i, { fitness: [this.population[0].fitness, this.population[1].fitness] }, false);
            this.notification(this.population);
            this._createNewGeneration(fittest);
        }
    }

    _initPopulation() {
        // Not implementing seeding for now, as I already have the training data.
        // console.log('_initPopulation() started');
        this.population = this.population.map((gene) => {
            return {
                gene,
                fitness: null
            };
        });
        // console.log('_initPopulation() finished');
        // console.log('population', this.population);
    }

    _computePopulationFitness() {
        // console.log('_computePopulationFitness() started');
        // console.log('population', this.population);
        return new Promise((resolve, reject) => {
            const fitnessPromises = this.population.map((individual, i) => {
                return this.fitness(individual.gene, i);
            });
            Promise.all(fitnessPromises).then((fitnesses) => {
                fitnesses.forEach((fitness, i) => {
                    this.population[i].fitness = fitness;
                });
                // console.log('_computePopulationFitness() finised');
                // console.log('population', this.population);
                resolve();
            })
        });
    }

    _selectFittestGenes() {
        // console.log('In _selectFittestGenes()');
        this.population.sort((a, b) => {
            let sort = b.fitness - a.fitness;
            if (this.config.optimise === 'min') {
                sort *= -1;
            }
            return sort;
        });
        // console.log('Population after sort', this.population);
        // return [this.population[0], this.population[1]];
    }

    _createNewGeneration() {
        // console.log('In _createNewGeneration()');
        const createAndAddNewborns = (gene1, gene2) => {
            let newborns = this.crossover(gene1, gene2);
            newborns[0] = this.mutate(newborns[0], 10);
            newborns[1] = this.mutate(newborns[1], 10);
            this.population.push(newborns[0], newborns[1]);
        };

        this.oldGeneration = JSON.parse(JSON.stringify(this.population))
        this.population = [];
        for (let i = 0; i < this.config.size / 4; i++) {
            createAndAddNewborns(this.oldGeneration[0].gene, this.oldGeneration[1].gene);
            createAndAddNewborns(this.oldGeneration[2].gene, this.oldGeneration[3].gene);
        }
    }
}

export default Genetic;