import mapManager from "./MapManager.js";
import spriteManager from "./SpritesManager.js";
import eventsManager from "./EventsManager.js";
import {Player, Food, Key, Enemy, Door, Ladder} from "./EntitiesManager.js";
import physicManager from "./PhysicManager.js";
import soundManager from "./SoundManager.js";


const canvas = document.getElementById("canvasId");
const ctx = canvas.getContext("2d");

const canvasStats = document.getElementById("canvasStats")
const ctxStats = canvasStats.getContext("2d")

ctx.textAlign = "center"
ctxStats.textAlign = "center"
ctxStats.fillStyle = "rgb(44, 117, 44)"
const x = canvasStats.width / 2

class GameManager {
    constructor() {
        console.log('game')
        this.factory = {};      // объект, который будет хранить конструкторы сущностей
        this.level = parseInt(localStorage["maze.level"]);      // текущий уровень игры, загруженный из локального хранилища
        this.entities = [];     // массив, который хранит все сущности
        this.player = null;
        this.spriteCount = 0
        this.attackRadius = 50;
        this.attackCooldown = false;

        if (!localStorage["maze.storage"]){     // если в локальном хранилище нет данных о рекордах, создается пустой массив
            localStorage["maze.storage"] = "[]"
        }
    }

    initPlayer(obj) {
        if (this.player !== null){      // Если игрок уже существует, сохраняются его текущие характеристики и переносятся в новый объект
            let score = this.player.score
            let life = this.player.life
            let speed = this.player.speed
            let attackCooldown = this.player.attackCooldown
            this.player = obj
            this.player.score = score
            this.player.life = life
            this.player.speed = speed
            this.player.attackCooldown = attackCooldown
        }
        else{   // присваивается новый объект
            this.player = obj;
        }
    }

    kill(obj) {     // удаляет сущность из массива this.entities
        for (const [index, entity] of this.entities.entries()) {
            if (obj === entity) {
                this.entities.splice(index, 1)
                break
            }
        }
    }

    draw() {    // Отрисовывает все сущности на экране
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].draw(ctx, this.spriteCount);
        }
        this.drawStats()   // отрисовывает статистику игры
    }

    drawStats() {
        ctxStats.clearRect(0, 0, 300, 500)
        ctxStats.font = "bold 28px GoldmanB"
        ctxStats.fillStyle = "red"
        ctxStats.fillText(`Уровень: ${this.level}`, x, 50)

        ctxStats.font = "bold 28px GoldmanB"
        ctxStats.fillText(`Имя: ${this.player.nickname}`, x, 130)
        ctxStats.fillText(`Счет: ${this.player.score}`, x, 170)
        ctxStats.fillText(`Жизни: ${this.player.life}`, x, 210)

        ctxStats.font = "bold 22px GoldmanB"
        ctxStats.fillText('Для перемещения вверх/вниз:', x, 320)
        ctxStats.fillText('"W" / "S"', x, 350)

        ctxStats.fillText('Для перемещения влево/вправо:', x, 380)
        ctxStats.fillText('"A" / "D"', x, 410)

        ctxStats.fillText('Для атаки: «ПРОБЕЛ»', x, 440)

    }

    save() {    // Сохраняет рекорд игрока в локальное хранилище
        const data = localStorage["maze.storage"]
        const jsonData = JSON.parse(data);
        let user = null

        if (jsonData > 0) {      // Проверяем, есть ли данные в хранилище
            user = jsonData.find(user => user.name === this.player.nickname)       // Ищем игрока в массиве данных по его имени
        }

        if (user){
            if (user.score < this.player.score){    // Проверяем, является ли текущий счет игрока выше, чем сохраненный
                user.score = this.player.score
                localStorage["maze.storage"] = JSON.stringify(jsonData)
            }
        }
        else {      // Добавляем нового игрока в массив данных
            jsonData.push({
                name: this.player.nickname,
                score: this.player.score
            })
            localStorage["maze.storage"] = JSON.stringify(jsonData)
        }

    }

    getSortRecords() {      // Возвращает отсортированный по убыванию счета список рекордов из локального хранилища
        const data = localStorage["maze.storage"]
        const jsonData = JSON.parse(data);

        if (jsonData) {
            jsonData.sort((user1, user2) => user1.score > user2.score ? -1 : 1)
        }

        return jsonData
    }

    winGame() {
        soundManager.play('../sounds/win.wav')
        ctx.fillStyle = "rgba(49,49,49,0.68)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = "rgb(255,0,0)"
        ctx.font = "60px GoldmanB"

        ctx.fillText('Ты победил!', canvas.width / 2, 100)

        ctx.fillStyle = "rgb(0,0,0)"
        ctx.font = "35px GoldmanB"
        ctx.fillText('Рекорды:', canvas.width / 2, 200)

        const records = this.getSortRecords()

        ctx.textAlign = "left"
        for (let i = 0; i < (records.length >= 5 ? 5 : records.length); i ++){
            ctx.fillText(`${i + 1}. ${records[i].name} - ${records[i].score}`, 200, 260 + i * 50)
        }
    }

    loseGame() {
        soundManager.play('../sounds/lose.wav')
        ctx.fillStyle = "rgba(49,49,49,0.68)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = "rgb(255,0,0)"
        ctx.font = "60px GoldmanB"

        ctx.fillText('Ты проиграл!', canvas.width / 2, 100)

        ctx.fillStyle = "rgb(0,0,0)"
        ctx.font = "35px GoldmanB"
        ctx.fillText('Рекорды:', canvas.width / 2, 200)

        const records = this.getSortRecords()

        ctx.textAlign = "left"
        for (let i = 0; i < (records.length >= 5 ? 5 : records.length); i ++){
            ctx.fillText(`${i + 1}. ${records[i].name} - ${records[i].score}`, 200, 260 + i * 50)
        }
    }

    endGame(str) {
        clearInterval(this.interval)
        const result = str

        this.save()

        if (result === 'Win'){
            if (this.level === 2){
                this.winGame()
            }
            if (this.level === 1){
                this.level = 2
                localStorage["maze.level"] = 2
                this.entities = []
                this.loadAll()
                //this.winGame()
            }
        }
        if (result === 'Lose'){
            this.loseGame()
        }
    }

    checkObjects() {
        for (const entity of this.entities) {       // Цикл по всем объектам
            if (entity.name === 'Food' || entity.name === 'Key') {
                if (physicManager.isClose(this.player, entity)) {

                    if (entity.name === 'Food') {
                        physicManager.getFood(this.player)
                    }
                    if (entity.name === 'Key') {
                        soundManager.play('../sounds/key.wav')
                        this.player.key = true
                    }
                    this.kill(entity)
                }
            }

            if (entity.name === 'Ladder') { // this.player.key
                if (physicManager.isClose(this.player, entity)) {
                    soundManager.play('../sounds/ladder.wav')
                    this.endGame('Win')
                    return "Exit";
                }

            }

            if (entity.name === 'Door' && !entity.opened) {
                if (physicManager.isClose(this.player, entity)) {
                    physicManager.openDoor(entity)
                }

            }

        }
    }

    checkEnemies() {
        const now = Date.now(); // Текущее время
    
        for (const entity of this.entities) {       // Цикл проходит по всем объектам в массиве this.entities
            if (entity.name === 'Enemy') {      // Если объект является врагом
                // Если враг видит игрока, двигаемся к нему
                if (physicManager.inActiveSpace(this.player, entity)) {     // находится ли игрок в зоне видимости врага
                    physicManager.clearDirection(entity);           // сбрасывает текущее направление враг
                    physicManager.enemyDirection(this.player, entity); // Двигаемся к игроку
                    
                    const isLive = physicManager.getDamage(this.player, entity);      //  проверяет, нанес ли враг урон игроку
                    if (!isLive) {
                        this.endGame('Lose');
                        return "Dead";
                    }
    
                    if (physicManager.move(entity) === 'move') {    // Если враг может двигаться, вызывается entity.move() для обновления его позиции
                        entity.move();
                    }
                    continue; // Пропускаем случайное движение, если враг преследует игрока
                }
    
                // Если игрок далеко, переключаемся на случайное движение
                if (!entity.nextMoveTime || now > entity.nextMoveTime) {
                    entity.nextMoveTime = now + 2000; // Таймер для смены направления
    
                    // Выбираем случайное направление
                    const randomDirection = Math.floor(Math.random() * 4);
                    switch (randomDirection) {
                        case 0:
                            entity.move_x = 0;
                            entity.move_y = -1; // Вверх
                            break;
                        case 1:
                            entity.move_x = 0;
                            entity.move_y = 1; // Вниз
                            break;
                        case 2:
                            entity.move_x = -1;
                            entity.move_y = 0; // Влево
                            break;
                        case 3:
                            entity.move_x = 1;
                            entity.move_y = 0; // Вправо
                            break;
                    }
                }
    
                // Проверяем движение и столкновения
                const result = physicManager.move(entity);
                if (result === "break") {
                    // Если враг столкнулся со стеной, меняем направление немедленно
                    entity.nextMoveTime = 0; // Принудительная смена направления
                    entity.move_x = 0;
                    entity.move_y = 0;
                } else if (result === "move") {
                    entity.move(); // Обновляем позицию врага
                }
            }
        }
    }
    
    

    update() {
        if (this.player === null)
            return;

        this.spriteCount = (this.spriteCount + 1) % 6      // Обновление счетчика спрайтов

        physicManager.clearDirection(this.player)      // Очистка направления игрока
        physicManager.playerDirection(this.player, this.entities)   // Определение направления игрока

        if (this.checkEnemies() === "Dead"){    // проверяет взаимодействие игрока с врагами
            this.drawStats()
            return;
        }

        if (this.player.move_x || this.player.move_y) {     // Проверка взаимодействий с объектами

            if (this.checkObjects() === "Exit"){    // игрок завершил уровень
                this.drawStats()
                return;
            }

            if (physicManager.move(this.player) === 'move') {   // может ли игрок двигаться в текущем направлении
                this.player.move()
            }
        }
        mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        mapManager.draw(ctx);
        this.draw();
    }

    loadAll() { // загружает все необходимые ресурсы для игры и настраивает начальное состояние
        mapManager.loadMap();       // загружает карту уровня
        spriteManager.loadAtlas('/src/sprites/sprites.json', '/src/sprites/spritesheet.png');
        this.factory["Player"] = Player;
        this.factory["Food"] = Food;
        this.factory["Key"] = Key;
        this.factory["Door"] = Door;
        this.factory["Door_closed"] = Door;
        this.factory["Enemy"] = Enemy;
        this.factory["Ladder"] = Ladder;

        mapManager.parseEntities(); // парсит карту и создает объекты
        mapManager.draw();     // отрисовывает карту

        eventsManager.setup(canvas); // настраивает события для игры

        soundManager.init(); // инициализирует звуки
        soundManager.loadArray(soundManager.sounds); // загружает звуки
        this.play();
    }


    play() {
        this.interval = setInterval(updateWorld, 100);
    }
}

function updateWorld() {  // функция обновления игрового мира
    gameManager.update();
}

function clearRecords() {       // функция очистки рекордов
    localStorage["maze.storage"] = JSON.stringify([]);
    console.log("Records table cleared.");
}

const gameManager = new GameManager();
export default gameManager;

gameManager.loadAll();
