import Genetic from 'genetic-lib'
import Draggabilly from 'draggabilly'
import Fly from './Fly'
import World from './World'

class GeneticFlyInMaze {
  constructor () {
    this.trainingData
    this.startStopElm = document.getElementById('start-stop')
    this.pauseElm = document.getElementById('pause')
    this.replayElm = document.getElementById('replay')
    this.onReplayClickedBound
    this.settings = {}
    this.world = new World({
      width: 600,
      height: 350,
      elmId: 'maze'
    })
    this.flySettings = {
      width: 25,
      height: 25,
      flightDistance: 15,
      world: this.world,
      interval: 0
    }
    this.seedsUsed
    this.appSettings = {
      populationSize: 20,
      interval: 0,
      minInterval: 0,
      maxInterval: 1000,
      intervalIncrementPercentage: 5,
      NUM_POSSIBLE_DIRECTIONS: 3
    }
    this.appSettings.defaultInterval = this.appSettings.interval
    this.DOMElements = {
      mazeWrapper: document.getElementById('maze-wrapper'),
      slowDownButton: document.getElementById('slow-down'),
      speedUpButton: document.getElementById('speed-up'),
      resetSpeedButton: document.getElementById('reset-speed'),
      speedValueButton: document.getElementById('speed-value'),
      generationTableHeaderRow: document.getElementById(
        'generation-table-header-row'
      ),
      bestFitness: document.getElementById('best-fitness'),
      bestFitnessGeneration: document.getElementById('best-fitness-generation')
    }
    this.genetic = null
  }

  init () {
    this.DOMElements.mazeWrapper.classList.add('training')
    const flies = []
    for (let i = 0; i < this.appSettings.populationSize; i++) {
      flies.push(
        new Fly({
          ...this.flySettings,
          ...{
            elmId: `fly${i}`
          }
        })
      )
    }

    const promises = []

    flies.forEach(fly => {
      promises.push(fly.autoPilot())
    })

    Promise.all(promises).then(trainingData => {
      this.trainingData = trainingData
      this.DOMElements.mazeWrapper.classList.remove('training')
      this.DOMElements.mazeWrapper.classList.add('ready')
      window.setTimeout(() => {
        this.DOMElements.mazeWrapper.classList.remove('ready')
      }, 1500)
      this._ready()
    })
  }

  _initDraggable () {
    const draggableElms = document.getElementsByClassName('draggable')
    const draggies = []
    for (let i = 0; i < draggableElms.length; i++) {
      draggies.push(
        new Draggabilly(draggableElms[i], {
          containment: '.maze'
        })
      )
    }
  }

  _ready () {
    const startClicked = () => {
      this.startStopElm.removeEventListener('click', boundStartClicked)
      this._run()
    }

    this.startStopElm.disabled = false
    const boundStartClicked = startClicked.bind(this)
    this.startStopElm.addEventListener('click', boundStartClicked)
    this._initDraggable()
  }

  _seed = () => {
    const seed = this.trainingData[this.seedsUsed]
    if (++this.seedsUsed >= this.trainingData.length) {
      this.seedsUsed = 0
    }
    return seed
  }

  _mutate = DNA => {
    const mutated = DNA.slice()
    let index = Math.floor(Math.random() * DNA.length)
    let plusOrMinusOne = Math.floor(Math.random() * 2) ? 1 : -1
    mutated[index] =
      (mutated[index] +
        this.appSettings.NUM_POSSIBLE_DIRECTIONS +
        plusOrMinusOne) %
      this.appSettings.NUM_POSSIBLE_DIRECTIONS
    return mutated
  }

  _crossover (mother, father) {
    // two-point crossover
    const length = mother.length
    let ca = Math.floor(Math.random() * length)
    let cb = Math.floor(Math.random() * length)
    if (ca > cb) {
      let tmp = cb
      cb = ca
      ca = tmp
    }

    const son = father
      .slice(0, ca)
      .concat(mother.slice(ca, cb), father.slice(cb))
    const daughter = mother
      .slice(0, ca)
      .concat(father.slice(ca, cb), mother.slice(cb))

    return [son, daughter]
  }

  _fitness = async (
    DNA,
    entityId = 'entity0',
    interval = this.appSettings.interval
  ) => {
    const fly = new Fly({
      ...this.flySettings,
      ...{
        elmId: entityId,
        interval
      }
    })
    let fitness

    try {
      const locationHistory = await fly.autoPilot(DNA.slice())
      fitness = locationHistory.length
    } catch (e) {
      fitness = 1000000
    }
    return fitness
  }

  _notification = stats => {
    const updateFittestEverInView = () => {
      this.DOMElements.bestFitness.innerHTML = stats.fittestEver.fitness
      this.DOMElements.bestFitnessGeneration.innerHTML =
        stats.fittestEver.generation
      this.DOMElements.bestFitness.style.display = 'none'
      setTimeout(() => {
        this.DOMElements.bestFitness.style.display = 'inline-block'
      }, 0)
    }

    this._killTheWeak(stats.population)
    const row = document.createElement('tr')
    row.classList.add('data-row')
    const generationCell = document.createElement('td')
    generationCell.innerHTML = stats.generation
    const meanCell = document.createElement('td')
    meanCell.innerHTML = stats.mean
    const fitnessesCell = document.createElement('td')
    stats.population.forEach((entity, i) => {
      const fitness =
        entity.fitness === this.settings.initialFitness ? 'X' : entity.fitness
      const fitnessHTML =
        i < this.settings.numberOfFittestToSelect
          ? `, <strong>${fitness}</strong>`
          : `, ${fitness}`
      fitnessesCell.innerHTML += fitnessHTML
    })
    fitnessesCell.innerHTML = fitnessesCell.innerHTML.substring(2)
    row.appendChild(generationCell)
    row.appendChild(meanCell)
    row.appendChild(fitnessesCell)
    this.DOMElements.generationTableHeaderRow.parentNode.insertBefore(
      row,
      this.DOMElements.generationTableHeaderRow.nextSibling
    )
    if (
      stats.fittestEver.generation <= stats.generation &&
      stats.fittestEver.generation > stats.generation - this.settings.skip
    ) {
      updateFittestEverInView()
    }
  }

  _onPauseClicked = () => {
    const pauseElm = this.pauseElm
    pauseElm.innerHTML = pauseElm.innerHTML === 'Pause' ? 'Resume' : 'Pause'
    pauseElm.classList.toggle('paused')
    this.genetic.togglePaused()
  }

  _onStopClicked = () => {
    this.genetic.stop()
  }

  _isFinished (stats) {
    return stats.generation >= 500
  }

  _onFinished = stats => {
    this.pauseElm.removeEventListener('click', this._onPauseClicked)
    this.startStopElm.removeEventListener('click', this._onStopClicked)
    this.pauseElm.disabled = true
    if (this.pauseElm.classList.contains('paused')) {
      this._onPauseClicked()
    }
    this.startStopElm.innerHTML = 'Start'
    this.startStopElm.classList.remove('started')
    this.replayElm.classList.remove('hidden')
    this.onReplayClickedBound = onReplayClicked.bind(this, stats)
    this.replayElm.addEventListener('click', this.onReplayClickedBound)
    this._ready()

    function onReplayClicked () {
      this.appSettings.interval = this.appSettings.maxInterval * 0.2
      this._updateSpeedInView()
      this.settings.fitness(
        stats.fittestEver.DNA,
        'fittest',
        this.appSettings.interval
      )
    }
  }

  _killTheWeak (population) {
    for (let i = 0; i < population.length; i++) {
      document.getElementById(`entity${i}`) &&
        document
          .getElementById(`entity${i}`)
          .dispatchEvent(new CustomEvent('fittest-found'))
    }
  }

  _updateSpeedInView () {
    document.getElementById('speed-value').innerHTML = `${(
      100 -
      this.appSettings.interval / (this.appSettings.maxInterval / 100)
    ).toFixed(0)}%`
  }

  _initFunction = () => {
    const appSettings = this.appSettings

    const setupUIElements = () => {
      this._updateSpeedInView()
      this.DOMElements.slowDownButton.disabled = false
      this.DOMElements.resetSpeedButton.disabled = false
      this.DOMElements.speedUpButton.disabled = false
      this.pauseElm.disabled = false
      this.pauseElm.removeEventListener('click', this._onPauseClicked)
      this.startStopElm.classList.add('started')
      this.startStopElm.innerHTML = 'Stop'
      this.replayElm.classList.add('hidden')
      if (this.onReplayClickedBound) {
        this.replayElm.removeEventListener('click', this.onReplayClickedBound)
      }
    }

    const resetNotificationTable = () => {
      const dataRows = document.querySelectorAll('#generation-table .data-row')
      for (let i = 0; i < dataRows.length; i++) {
        dataRows[i].parentElement.removeChild(dataRows[i])
      }
    }

    const addEventListeners = () => {
      this.pauseElm.addEventListener('click', this._onPauseClicked)
      this.startStopElm.addEventListener('click', this._onStopClicked)
      this.DOMElements.slowDownButton.addEventListener('click', () => {
        appSettings.interval += intervalIncrement
        if (appSettings.interval > appSettings.maxInterval) {
          appSettings.interval = appSettings.maxInterval
        }
        dispatchFlySpeedEvent()
        this._updateSpeedInView()
      })
      this.DOMElements.speedUpButton.addEventListener('click', () => {
        const suggestedInterval = appSettings.interval - intervalIncrement
        appSettings.interval =
          suggestedInterval > 0 ? suggestedInterval : appSettings.minInterval
        dispatchFlySpeedEvent()
        this._updateSpeedInView()
      })
      this.DOMElements.resetSpeedButton.addEventListener('click', () => {
        appSettings.interval = appSettings.defaultInterval
        dispatchFlySpeedEvent()
        this._updateSpeedInView()
      })
    }

    const dispatchFlySpeedEvent = () => {
      const event = new CustomEvent('change-fly-speed', {
        detail: appSettings.interval
      })
      document.dispatchEvent(event)
    }

    this.seedsUsed = 0
    this.appSettings.interval = this.appSettings.defaultInterval
    const intervalIncrement =
      appSettings.maxInterval / 100 * appSettings.intervalIncrementPercentage
    setupUIElements()
    resetNotificationTable()
    addEventListeners()
  }

  _run () {
    this.settings = {
      init: this._initFunction,
      seed: this._seed,
      mutate: this._mutate,
      crossover: this._crossover,
      fitness: this._fitness,
      notification: this._notification,
      isFinished: this._isFinished,
      onFinished: this._onFinished,
      populationSize: this.appSettings.populationSize,
      mutationIterations: 5,
      skip: 1,
      optimise: 'min',
      initialFitness: 1111,
      numberOfFittestToSelect: 4,
      shouldKillTheWeak: true
    }

    this.genetic = new Genetic(this.settings)
    this.genetic.solve()
  }
}

export default GeneticFlyInMaze