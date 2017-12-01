import Genetic from 'genetic-js';

class GeneticFlyInMaze {
    constructor(trainingData) {
        this.trainingData = trainingData;
    }

    solve() {
        const genetic = Genetic.create();

        genetic.optimize = Genetic.Optimize.Maximize;
        genetic.select1 = Genetic.Select1.Tournament2;
        genetic.select2 = Genetic.Select2.Tournament2;

        genetic.seed = function() {

        }
    }
}

export default GeneticFlyInMaze;