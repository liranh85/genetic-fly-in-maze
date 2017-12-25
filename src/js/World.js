class World {
    constructor(settings) {
        this.width = settings.width;
        this.height = settings.height;
        this.worldElm = document.getElementById(settings.elmId);
    }

    isElementInWorld(coordinates, elmWidth, elmHeight) {
        return coordinates.x >= 0
        && coordinates.x + elmWidth <= this.width
        && coordinates.y >= 0
        && coordinates.y + elmHeight <= this.height;
    }

    isElementOnOtherElement(coordinates, elmWidth, elmHeight, targetElmClass) {
        const targetElms = document.querySelectorAll(`.${targetElmClass}`);
        for (let i = 0; i < targetElms.length; i++) {
            if (coordinates.x + elmWidth >= targetElms[i].offsetLeft
                && coordinates.x <= targetElms[i].offsetLeft + targetElms[i].offsetWidth
                && coordinates.y + elmHeight >= targetElms[i].offsetTop
                && coordinates.y <= targetElms[i].offsetTop + targetElms[i].offsetHeight) {
                return true;
            }
        }
        return false;
    }

    isElementAtExit(coordinates, elmWidth, elmHeight) {
        const exit = document.getElementById('exit');

        if (coordinates.x + elmWidth >= exit.offsetLeft
            && coordinates.y >= exit.offsetTop
            && coordinates.y + elmWidth <= exit.offsetTop + exit.offsetHeight) {
            return true;
        }
    }
}

export default World;