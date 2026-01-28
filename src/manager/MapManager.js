import gameManager from "./GameManager.js";

class MapManager {
    constructor(props) {
        console.log('map')
        this.canvas = document.getElementById("canvasId");
        this.ctx = this.canvas.getContext("2d");
        this.mapData = null;    // Хранит данные карты
        this.available = null;  // Хранит данные о проходимости
        this.tLayer = null; // Хранит текущий слой тайлов
        this.xCount = 0;    // Количество тайлов по X
        this.yCount = 0;    // Количество тайлов по Y
        this.tSize = {x: 64, y: 64};    // Размер тайла
        this.mapSize = {x: 1920, y: 1920};  // общий Размер карты
        this.tilesets = [];     // Массив для хранения наборов тайлов
        this.imgLoadCount = 0;
        this.imgLoaded = false;
        this.jsonLoaded = false;
        this.view = {x: 0, y: 0, w: this.canvas.width, h: this.canvas.height};      // Позиция и размер области просмотра
        this.path = {       // Позиция и размер области пути
            1 : "/src/maps/map1.json",
            2 : "/src/maps/map2.json"
        }
    }

    loadMap() {
        console.log("MAP LOADED")
        this.jsonLoaded = false     // сбросить флаг загрузки json
        this.imgLoaded = false      // сбросить флаг загрузки картинок
        this.imgLoadCount = 0       // сбросить счетчик загруженных картинок
        const path = this.path[gameManager.level]
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {        // Устанавливаем обработчик события изменения состояния запроса
            if (request.readyState === 4 && request.status === 200) {
                console.log(request.responseText);
                this.parseMap(request.responseText);
            }
        };
        request.open("GET", path, true);    // Открываем GET-запрос к указанному URL
        request.send();
    }

    parseMap(tilesJSON) {
        console.log("MAP PARSED")
        this.mapData = JSON.parse(tilesJSON);       // Парсим JSON в объект
        this.available = this.mapData.layers[0].data;  // слой проходимости
        this.xCount = this.mapData.width;       // Количество тайлов по X
        this.yCount = this.mapData.height;
        this.tSize.x = this.mapData.tilewidth;  // Размер тайла по X
        this.tSize.y = this.mapData.tileheight;
        this.mapSize.x = this.xCount * this.tSize.x;    // общий Размер карты по X
        this.mapSize.y = this.yCount * this.tSize.y;
    }

    parseMap(tilesJSON) {
        console.log("MAP PARSED")
        this.mapData = JSON.parse(tilesJSON);       // Парсим JSON в объект
        this.available = this.mapData.layers[0].data    // Извлекаем данные о проходимости из первого слоя карты
        this.xCount = this.mapData.width;
        this.yCount = this.mapData.height;
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;
        this.mapSize.x = this.xCount * this.tSize.x;
        this.mapSize.y = this.yCount * this.tSize.y;

        for (let i = 0; i < this.mapData.tilesets.length; i++) {    // Загружаем изображения для каждого набора тайлов
            const img = new Image();    // Создаем объект изображения
            img.onload = () => {
                this.imgLoadCount++;
                if (this.imgLoadCount === this.mapData.tilesets.length) {
                    this.imgLoaded = true;      // Если все изображения загружены, устанавливаем флаг
                }
            };
            img.onerror = (error) => {
                console.error('Image load error:', error);      // Выводим ошибку, если изображение не загрузилось
            };
            img.src = this.mapData.tilesets[i].image;     // Устанавливаем путь к изображению
            const t = this.mapData.tilesets[i];     // Создаем объект с информацией о наборе тайлов
            const ts = {
                firstgid: t.firstgid,       // Первый глобальный идентификатор тайла в наборе
                image: img,     // Загруженное изображение
                name: t.name,   // Имя набора тайлов
                xCount: Math.floor(t.imagewidth / this.tSize.x),    // 
                yCount: Math.floor(t.imageheight / this.tSize.y)
            };
            this.tilesets.push(ts); // Добавляем объект в массив наборов тайлов
        }
        this.jsonLoaded = true; // Устанавливаем флаг, что JSON загружен
    }

    draw() {
        if (!this.imgLoaded || !this.jsonLoaded) {      // Проверяем, загружены ли изображения и JSON-данные
            setTimeout(() => this.draw(), 100);     // Если нет, повторяем вызов метода через 100 мс
        } else {    // отрисовываем слои карты
            for (let id = 0; id < this.mapData.layers.length; id++) {
                const layer = this.mapData.layers[id];
                if (layer.type === "tilelayer") {   // Проверяем, является ли слой слоем тайлов
                    this.tLayer = layer;        // Сохраняем данные о слое тайлов
                    this.drawLayer();       // Рисуем слой тайлов
                } else
                    break;      // Если слой не является слоем тайлов, останавливаем цикл
            }
            gameManager.draw(this.ctx);     // Рисуем остальные элементы игры
        }
    }

    drawLayer() {       // Рисуем слой тайлов
        for (let i = 0; i < this.tLayer.data.length; i++) {
            if (this.tLayer.data[i] !== 0) {
                const tile = this.getTile(this.tLayer.data[i]);
                let pX = (i % this.xCount) * this.tSize.x;
                let pY = Math.floor(i / this.xCount) * this.tSize.y;

                if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y)) {
                    continue;
                }

                pX -= this.view.x;
                pY -= this.view.y;

                this.ctx.drawImage(     // Рисуем тайл
                    tile.img,
                    tile.px,
                    tile.py,
                    this.tSize.x,
                    this.tSize.y,
                    pX,
                    pY,
                    this.tSize.x,
                    this.tSize.y
                );
            }
        }
    }

    isVisible(x, y, width, height) {        // Проверяем, видим ли мы тайл
        return !(x + width < this.view.x ||
            y + height < this.view.y ||
            x > this.view.x + this.view.w ||
            y > this.view.y + this.view.h);

    }


    getTile(tileIndex) {        // Возвращает тайл по его индексу
        const tile = {
            img: null,
            px: 0,
            py: 0
        };
        const tileset = this.getTileset(tileIndex);
        tile.img = tileset.image;
        const id = tileIndex - tileset.firstgid;
        const x = id % tileset.xCount;
        const y = Math.floor(id / tileset.xCount);
        tile.px = x * this.tSize.x;
        tile.py = y * this.tSize.y;
        return tile;
    }

    getTileset(tileIndex) {     // Возвращает тайлсет по индексу тайла
        for (let i = this.tilesets.length - 1; i >= 0; i--) {
            if (this.tilesets[i].firstgid <= tileIndex) {
                return this.tilesets[i];
            }
        }
        return null;
    }

    getAvailableInfo(x, y) {        // Возвращает информацию о доступных тайлах
        let wX = x;
        let wY = y;
        let idx = Math.floor(wY / this.tSize.y) * this.xCount + Math.floor(wX / this.tSize.x);
        return this.available[idx];
    }

    centerAt(x, y) {        // Центрирует тайлсет по заданным координатам
        if (x < this.view.w / 2) this.view.x = 0;
        else if (x > this.mapSize.x - this.view.w / 2)
            this.view.x = this.mapSize.x - this.view.w;
        else this.view.x = x - this.view.w / 2;

        if (y < this.view.h / 2) this.view.y = 0;
        else if (y > this.mapSize.y - this.view.h / 2) {
            this.view.y = this.mapSize.y - this.view.h;
        } else {
            this.view.y = y - this.view.h / 2;
        }
    }

    parseEntities() {       // Парсит сущности
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(() => this.parseEntities(), 100);
        } else {
            console.log("ENTITY PARSED")
            for (let j = 0; j < this.mapData.layers.length; j++) {
                if (this.mapData.layers[j].type === 'objectgroup') {
                    const entities = this.mapData.layers[j];
                    for (let i = 0; i < entities.objects.length; i++) {
                        const e = entities.objects[i];
                        try {
                            if (e.type !== "") {
                                const obj = new gameManager.factory[e.type];
                                obj.name = e.name;
                                obj.pos_x = e.x;
                                obj.visible = e.visible;
                                if (e.type === 'Door' || e.type === 'Door_closed'){
                                    obj.pos_y = e.y - 64;

                                }
                                else{
                                    obj.pos_y = e.y - 32;
                                }
                                obj.size_x = e.width;
                                obj.size_y = e.height;
                                gameManager.entities.push(obj);
                                if (e.type === "Player") {
                                    gameManager.initPlayer(obj);
                                }
                            }
                        } catch (ex) {
                            console.log("Error while creating: [" + e.gid + "] " + e.type + ", " + ex);
                        }
                    }
                }
            }
        }
    }

}

const mapManager = new MapManager()
export default mapManager

