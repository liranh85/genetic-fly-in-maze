import Genetic from 'genetic-lib'
import Draggabilly from 'draggabilly'
import Fly from './Fly'
import World from './World'
import { events, NUM_POSSIBLE_DIRECTIONS } from './constants'

class GeneticFlyInMaze {
  constructor (options) {
    this.state = {
      interval: options.interval,
      shouldResetFittest: false,
      stats: null
    }
    this.options = options
    this.options.intervalIncrement = this._calcIntervalIncrement(options)
    this.world = new World({
      width: options.worldWidth || 600,
      height: options.worldHeight || 350,
      elmId: 'maze'
    })
    this.flyBaseSettings = {
      world: this.world,
      interval: 0
    }
    this.flyUserSettings = {
      width: options.flyWidth || 25,
      height: options.flyHeight || 25,
      flightDistance: options.flyFlightDistance || 15
    }
    this.elm = {
      bestFitness: document.getElementById('best-fitness'),
      bestFitnessGeneration: document.getElementById('best-fitness-generation'),
      generationTable: document.getElementById('generation-table'),
      generationTableHeaderRow: document.getElementById(
        'generation-table-header-row'
      ),
      maze: document.getElementById('maze'),
      mazeWrapper: document.getElementById('maze-wrapper'),
      pause: document.getElementById('pause'),
      replay: document.getElementById('replay'),
      resetSpeedButton: document.getElementById('reset-speed'),
      slowDownButton: document.getElementById('slow-down'),
      speedUpButton: document.getElementById('speed-up'),
      speedValue: document.getElementById('speed-value'),
      startStop: document.getElementById('start-stop')
    }
    this.css = {
      dataRow: 'data-row',
      draggable: 'draggable',
      hidden: 'hidden',
      maze: 'maze',
      paused: 'paused',
      training: 'training',
      ready: 'ready',
      started: 'started'
    }
    this.text = {
      pause: 'Pause',
      resume: 'Resume',
      start: 'Start',
      stop: 'Stop'
    }
    this.trainingData
    this.seedsUsed
    this.settings = {}
    this.genetic = null
  }

  _calcIntervalIncrement (options) {
    return options.maxInterval / 100 * options.intervalIncrementPercentage
  }

  async init () {
    const {
      _generateTrainingData,
      _initDraggable,
      _ready,
      _setMazeDimensions,
      _setupEvents
    } = this
    _setMazeDimensions()
    await _generateTrainingData()
    _initDraggable()
    _setupEvents()
    _ready()
  }

  _setMazeDimensions = () => {
    const { elm, options } = this
    elm.maze.style.width = `${options.worldWidth}px`
    elm.maze.style.height = `${options.worldHeight}px`
  }

  _generateTrainingData = async () => {
    const { options, css, elm, flyBaseSettings, flyUserSettings } = this
    elm.mazeWrapper.classList.add(css.training)
    const flies = []
    for (let i = 0; i < options.populationSize; i++) {
      flies.push(
        new Fly({
          ...flyBaseSettings,
          ...flyUserSettings,
          elmId: `fly${i}`
        })
      )
    }

    const flights = []

    flies.forEach(fly => {
      flights.push(fly.autoPilot())
    })

    try {
      this.trainingData = await Promise.all(flights)
    } catch (error) {
      console.error('Error occurred while collecting training data', error)
    }
    elm.mazeWrapper.classList.remove(css.training)
    elm.mazeWrapper.classList.add(css.ready)
    window.setTimeout(() => {
      elm.mazeWrapper.classList.remove(css.ready)
    }, 1500)
  }

  _setupEvents = () => {
    const { _onClickSlowDown, _onClickSpeedUp, _onClickResetSpeed, elm } = this
    elm.slowDownButton.addEventListener('click', _onClickSlowDown)
    elm.speedUpButton.addEventListener('click', _onClickSpeedUp)
    elm.resetSpeedButton.addEventListener('click', _onClickResetSpeed)
  }

  _ready = () => {
    const { _run, elm, trainingData } = this
    const onClickStart = () => {
      elm.startStop.removeEventListener('click', onClickStart)
      _run()
    }

    elm.startStop.disabled = false
    elm.startStop.addEventListener('click', onClickStart)
  }

  _initDraggable = () => {
    const { css } = this
    const draggableElms = document.getElementsByClassName(css.draggable)
    Array.prototype.forEach.call(draggableElms, draggableElm => {
      const draggie = new Draggabilly(draggableElm, {
        containment: `.${css.maze}`
      })
      draggie.on('dragEnd', this._resetFittest)
    })
  }

  _resetFittest = event => {
    window.setTimeout(() => {
      this.state.shouldResetFittest = true
    }, 500)
  }

  _seed = () => {
    const { trainingData } = this
    const seed = trainingData[this.seedsUsed]
    if (++this.seedsUsed >= trainingData.length) {
      this.seedsUsed = 0
    }
    return seed
  }

  _mutate = DNA => {
    const mutated = DNA.slice()
    let index = Math.floor(Math.random() * DNA.length)
    let plusOrMinusOne = Math.floor(Math.random() * 2) ? 1 : -1
    mutated[index] =
      (mutated[index] + NUM_POSSIBLE_DIRECTIONS + plusOrMinusOne) %
      NUM_POSSIBLE_DIRECTIONS
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

  _fitness = async (DNA, entityId) => {
    const fly = new Fly({
      ...this.flyBaseSettings,
      ...this.flyUserSettings,
      ...{
        elmId: entityId,
        interval: this.state.interval
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
    const {
      _killTheWeak,
      _updateGenerationTable,
      _updateFittestEverInView
    } = this
    _killTheWeak(stats.population)
    _updateGenerationTable(stats)
    _updateFittestEverInView(stats)
    this.state.shouldResetFittest = false
  }

  _killTheWeak (population) {
    for (let i = 0; i < population.length; i++) {
      document.getElementById(`entity${i}`) &&
        document
          .getElementById(`entity${i}`)
          .dispatchEvent(new CustomEvent(events.FITTEST_FOUND))
    }
  }

  _updateGenerationTable = stats => {
    const { css, elm, settings } = this
    const row = document.createElement('tr')
    row.classList.add(css.dataRow)
    if (this.state.shouldResetFittest) {
      row.classList.add('maze-changed')
    }
    const generationCell = document.createElement('td')
    generationCell.innerHTML = stats.generation
    const meanCell = document.createElement('td')
    meanCell.innerHTML = stats.mean
    const fitnessesCell = document.createElement('td')
    stats.population.forEach((entity, i) => {
      const fitness =
        entity.fitness === settings.initialFitness ? 'X' : entity.fitness
      const fitnessHTML =
        i < settings.numberOfFittestToSelect
          ? `, <strong>${fitness}</strong>`
          : `, ${fitness}`
      fitnessesCell.innerHTML += fitnessHTML
    })
    fitnessesCell.innerHTML = fitnessesCell.innerHTML.substring(2)
    row.appendChild(generationCell)
    row.appendChild(meanCell)
    row.appendChild(fitnessesCell)
    elm.generationTableHeaderRow.parentNode.insertBefore(
      row,
      elm.generationTableHeaderRow.nextSibling
    )
  }

  _updateFittestEverInView = stats => {
    const { elm, settings } = this
    let fittestEver
    if (this.state.shouldResetFittest) {
      fittestEver = {
        DNA: stats.population[0].DNA,
        fitness: stats.population[0].fitness,
        generation: stats.generation
      }
      this.genetic.setFittestEver(fittestEver)
    } else {
      if (
        stats.fittestEver.generation > stats.generation ||
        stats.fittestEver.generation <= stats.generation - settings.skip
      ) {
        return
      }
      fittestEver = stats.fittestEver
    }
    elm.bestFitness.innerHTML = fittestEver.fitness
    elm.bestFitnessGeneration.innerHTML = fittestEver.generation
    elm.bestFitness.style.display = 'none'
    setTimeout(() => {
      elm.bestFitness.style.display = 'inline-block'
    }, 0)
  }

  _onClickPause = () => {
    const { css, elm, genetic, text } = this
    elm.pause.innerHTML =
      elm.pause.innerHTML === text.pause ? text.resume : text.pause
    elm.pause.classList.toggle(css.paused)
    genetic.togglePaused()
  }

  _onClickStop = () => {
    this.genetic.stop()
  }

  _isFinished (stats) {
    return stats.generation >= 500
  }

  _onFinished = stats => {
    const {
      _ready,
      _setUIToFinished,
      _setupSimulationFinishedEvents,
      state
    } = this
    state.stats = stats
    _setupSimulationFinishedEvents()
    this._setUIToFinished()
    _ready()
  }

  _setupSimulationFinishedEvents = () => {
    const { _onClickReplay, _onClickStop, elm } = this
    elm.startStop.removeEventListener('click', _onClickStop)
    elm.replay.addEventListener('click', _onClickReplay)
  }

  _setUIToFinished = () => {
    const { _onClickPause, css, elm, text } = this
    elm.pause.disabled = true
    if (elm.pause.classList.contains(css.paused)) {
      _onClickPause()
    }
    elm.startStop.innerHTML = text.start
    elm.startStop.classList.remove(css.started)
    elm.replay.classList.remove(css.hidden)
  }

  _onClickReplay = () => {
    const { _updateSpeedInView, options, settings, state } = this
    state.interval = options.maxInterval * 0.2
    _updateSpeedInView()
    settings.fitness(state.stats.fittestEver.DNA, 'fittest')
  }

  _updateSpeedInView = () => {
    const { elm, options, state } = this
    elm.speedValue.innerHTML = `${(
      100 -
      state.interval / (options.maxInterval / 100)
    ).toFixed(0)}%`
  }

  _initSimulation = () => {
    const {
      _resetNotificationTable,
      _setupSimulationRunningEvents,
      _setUIToRunning,
      options,
      state
    } = this
    this.seedsUsed = 0
    state.interval = options.interval
    _setUIToRunning()
    _resetNotificationTable()
    _setupSimulationRunningEvents()
  }

  _setUIToRunning = () => {
    const { _updateSpeedInView, css, elm, text } = this
    _updateSpeedInView()
    elm.bestFitness.innerHTML = '?'
    elm.bestFitnessGeneration.innerHTML = '?'
    elm.slowDownButton.disabled = false
    elm.resetSpeedButton.disabled = false
    elm.speedUpButton.disabled = false
    elm.pause.disabled = false
    elm.startStop.classList.add(css.started)
    elm.startStop.innerHTML = text.stop
    elm.replay.classList.add(css.hidden)
  }

  _resetNotificationTable = () => {
    const { css, elm } = this
    const dataRows = elm.generationTable.querySelectorAll(`.${css.dataRow}`)
    Array.prototype.forEach.call(dataRows, row => {
      row.parentElement.removeChild(row)
    })
  }

  _setupSimulationRunningEvents = () => {
    const { _onClickPause, _onClickReplay, _onClickStop, elm } = this
    elm.pause.addEventListener('click', _onClickPause)
    elm.startStop.addEventListener('click', _onClickStop)
    if (_onClickReplay) {
      elm.replay.removeEventListener('click', _onClickReplay)
    }
  }

  _onClickSlowDown = () => {
    const { _dispatchFlySpeedEvent, _updateSpeedInView, options, state } = this
    const { intervalIncrement, maxInterval } = options
    state.interval += intervalIncrement
    if (state.interval > maxInterval) {
      state.interval = maxInterval
    }
    _dispatchFlySpeedEvent()
    _updateSpeedInView()
  }

  _onClickSpeedUp = () => {
    const { _dispatchFlySpeedEvent, _updateSpeedInView, options, state } = this
    const { intervalIncrement, minInterval } = options
    const suggestedInterval = state.interval - intervalIncrement
    state.interval = suggestedInterval > 0 ? suggestedInterval : minInterval
    _dispatchFlySpeedEvent()
    _updateSpeedInView()
  }

  _onClickResetSpeed = () => {
    const { _dispatchFlySpeedEvent, _updateSpeedInView, options, state } = this
    state.interval = options.interval
    _dispatchFlySpeedEvent()
    _updateSpeedInView()
  }

  _dispatchFlySpeedEvent = () => {
    const event = new CustomEvent(events.CHANGE_FLY_SPEED, {
      detail: this.state.interval
    })
    document.dispatchEvent(event)
  }

  _run = () => {
    const {
      generationsToSkip,
      mutationIterations,
      numberOfFittestToSelect,
      populationSize,
      shouldKillTheWeak
    } = this.options
    this.settings = {
      init: this._initSimulation,
      seed: this._seed,
      mutate: this._mutate,
      crossover: this._crossover,
      fitness: this._fitness,
      notification: this._notification,
      isFinished: this._isFinished,
      onFinished: this._onFinished,
      populationSize: populationSize || 20,
      mutationIterations: mutationIterations || 5,
      skip: generationsToSkip || 1,
      optimise: 'min',
      initialFitness: 1111,
      numberOfFittestToSelect: numberOfFittestToSelect || 4,
      shouldKillTheWeak: shouldKillTheWeak || true
    }

    this.genetic = new Genetic(this.settings)
    this.genetic.solve()
  }
}

export default GeneticFlyInMaze
