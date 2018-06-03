import GeneticFlyInMaze from './components/GeneticFlyInMaze'
import './style.scss'

const geneticFlyInMaze = new GeneticFlyInMaze({
  flyWidth: 25,
  flyHeight: 25,
  flyFlightDistance: 15,
  interval: 0,
  intervalIncrementPercentage: 5,
  maxInterval: 1000,
  minInterval: 0,
  mutationIterations: 5,
  numberOfFittestToSelect: 4,
  populationSize: 20,
  worldWidth: 600,
  worldHeight: 350,
  shouldKillTheWeak: true,
  generationsToSkip: 1
})

geneticFlyInMaze.init()
