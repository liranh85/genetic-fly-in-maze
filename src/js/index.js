import World from './World';
import Fly from './Fly';

// const distance = 5;
// const container = {
//     width: 600,
//     height: 350
// }

// function isElementInContainer(coordinates, elmWidth, elmHeight) {
//     return coordinates.x >= 0
//     && coordinates.x + elmWidth <= container.width
//     && coordinates.y >= 0
//     && coordinates.y + elmHeight <= container.height;
// }

// function isElementOnOtherElement(coordinates, elmWidth, elmHeight, targetElmClass) {
//     const targetElms = document.querySelectorAll(`.${targetElmClass}`);
//     for (let i = 0; i < targetElms.length; i++) {
//         if (coordinates.x + elmWidth >= targetElms[i].offsetLeft
//             && coordinates.x <= targetElms[i].offsetLeft + targetElms[i].offsetWidth
//             && coordinates.y + elmHeight >= targetElms[i].offsetTop
//             && coordinates.y <= targetElms[i].offsetTop + targetElms[i].offsetHeight) {
//             return true;
//         }
//     }
//     return false;
// }

// console.log(isElementOnOtherElement('block', 70, 50));


function getRandomDirection() {
    const rand = Math.random();
    if (rand <= 0.333) {
        return 'up';
    }
    if (rand <= 0.666) {
        return 'down';
    }
    return 'forward';
}

// function getNewCoordinates(coordinates, direction) {
//     const newCoordinates = {
//         x: coordinates.x,
//         y: coordinates.y
//     }
//     if (direction === 'up') {
//         newCoordinates.y += distance;
//     }
//     else if (direction === 'down') {
//         newCoordinates.y -= distance;
//     }
//     else if (direction === 'forward') {
//         newCoordinates.x += distance;
//     }
//     return newCoordinates;
// }
const world = new World({
    width: 600,
    height: 350
});
const fly = new Fly({
    elmId: 'fly1',
    speed: 10,
    width: 25,
    height: 25,
    flightDistance: 5,
    world: world
});

let interval = window.setInterval(() => {
    // let coordinates = getNewCoordinates(coordinates, getRandomDirection());
    
    // if (isElementInContainer(coordinates, fly.width, fly.height) && !isElementOnOtherElement(coordinates, fly.width, fly.height, 'block')) {
        // fly.flyTo(coordinates);
    fly.flyTo(getRandomDirection());
    // }

    if (fly.reachedExit()) {
        clearInterval(interval);
    }
}, fly.speed);