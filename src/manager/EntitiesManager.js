import spriteManager from "./SpritesManager.js";
import gameManager from './GameManager.js';
import mapManager from "./MapManager.js";


class Entity { //класс для создания сущности
    constructor() {
        console.log('entity')
        this.pos_x = 0; // X-координата позиции на карте
        this.pos_y = 0;
        this.size_x = 0; // Ширина объекта
        this.size_y = 0; // Высота объекта
        this.visible = true // Видим ли объект на экране
    }

    extend(extendProto) {
        const object = Object.create(this);     //  новый объект object, который наследует прототип текущего экземпляра класса Entity. (новый объект будет иметь доступ ко всем свойствам и методам Entity)
        for (const property in extendProto) {       // Цикл проходит по всем свойствам объекта extendProto, который передается в метод как аргумент
            if (this.hasOwnProperty(property) || typeof object[property] === 'undefined') {     // существует ли свойство property в текущем объекте (this) или оно не определено в новом объекте (object)
                object[property] = extendProto[property];       // Свойство из объекта extendProto копируется в новый объект object
            }
        }
        return object; // ВОЗВРАЩАЕМ ГОТОВЫЙ ОБЪЕКТ-ПОТОМОК
    }
}

export class Player extends Entity {
    constructor() {
        super();        // вызывает конструктор родительского класса Entity, чтобы инициализировать базовые свойства
        this.life = 10;
        this.move_x = 0;        // направление движения игрока 
        this.move_y = 0;
        this.speed = 7;
        this.key = false;
        this.score = 0;     // счет игрока
        this.timeOut = new Date().getTime();        //  время создания игрока
        this.direction = 0;     // направление
        this.lastAttackTime = 0;       // время последней атаки. Используется для управления задержкой между атаками
        this.attackCooldown = 1000; // Задержка между атаками в миллисекундах
        this.nickname = localStorage["maze.lastPlayer"];        // имя игрока, сохраненное в локальном хранилище браузера
        this.isAttacking = false; // Флаг атаки
        this.attackRadius = 80; // Радиус атаки
    }

    move() {        // Этот метод обновляет позицию игрока на основе его направления и скорости
        this.pos_x = this.pos_x + Math.floor(this.move_x * this.speed);
        this.pos_y = this.pos_y + Math.floor(this.move_y * this.speed);
    }

    canAttack() {   // может ли игрок атаковать, учитывая задержку между атаками
        const currentTime = Date.now(); // текущее время в миллисекундах.
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {     // Если разница между текущим временем и временем последней атаки больше или равна задержке
            this.lastAttackTime = currentTime;
            this.isAttacking = true;
            setTimeout(() => (this.isAttacking = false), this.attackCooldown - 100);       // Через setTimeout флаг isAttacking сбрасывается через attackCooldown - 100 миллисекунд (чтобы анимация атаки завершилась раньше, чем закончится задержка)
            this.swordAngle = 0;
            return true;        // атака возможна
        }
        return false;
    }

    addScore(amount) {      // увеличивает счет игрока 
        this.score += amount;
    }

    draw(ctx, spriteCount) {        // отвечает за отрисовку игрока на экране. использует контекст рисования ctx и номер спрайта spriteCount для анимации
        const centerX = this.pos_x - mapManager.view.x + this.size_x / 2;           // Вычисление центра игрока
        const centerY = this.pos_y - mapManager.view.y + this.size_y / 2;


        // Отрисовываем красный круг, если игрок атакует
        if (this.isAttacking) {
            // Градиентная заливка
            const gradient = ctx.createRadialGradient(
                centerX,
                centerY,
                this.attackRadius * 0.5,
                centerX,
                centerY,
                this.attackRadius
            );
            gradient.addColorStop(0, "rgba(255, 0, 0, 0.6)");
            gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.attackRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.closePath();
        
            // Пульсация
            const pulseRadius = this.attackRadius + Math.sin(Date.now() / 100) * 5;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
            
        }
        
    
        // Обычная отрисовка спрайтов игрока. В зависимости от направления движения (move_x, move_y), выбирается соответствующий спрайт
        if (this.move_x === 1) {
            spriteManager.drawSprite(ctx, 'Player', this.pos_x, this.pos_y, 64 * spriteCount, 384);     // spriteManager.drawSprite — метод для отрисовки спрайта. Параметры: ctx — контекст рисования. 'Player' — имя спрайта. this.pos_x, this.pos_y — координаты игрока. 64 * spriteCount — смещение по X для анимации. Последний параметр — смещение по Y для выбора направления.
            this.direction = 128;
            return;
        }
        if (this.move_x === -1) {
            spriteManager.drawSprite(ctx, 'Player', this.pos_x, this.pos_y, 64 * spriteCount, 448);
            this.direction = 192;
            return;
        }
        if (this.move_y === -1) {
            spriteManager.drawSprite(ctx, 'Player', this.pos_x, this.pos_y, 64 * spriteCount, 320);
            this.direction = 64;
            return;
        }
        if (this.move_y === 1) {
            spriteManager.drawSprite(ctx, 'Player', this.pos_x, this.pos_y, 64 * spriteCount, 256);
            this.direction = 0;
            return;
        }
        spriteManager.drawSprite(ctx, 'Player', this.pos_x, this.pos_y, 0, this.direction);
    }    
}

export class Enemy extends Entity {     // Враг
    constructor() {
        super();        // вызывает конструктор родительского класса Entity
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 10;
        if (gameManager.level === 2) {
            this.life = 1;
            this.speed = 10;
        } else {
            this.life = 1;
            this.speed = 10;
        }
    }

    move() {        // метод обновляет позицию врага на основе его направления и скорости
        this.pos_x = this.pos_x + Math.floor(this.move_x * this.speed);
        this.pos_y = this.pos_y + Math.floor(this.move_y * this.speed);
    }

    takeDamage() {
        this.life -= 1;
        if (this.life <= 0) {
            gameManager.kill(this);     // удалить врага из игры
            if (gameManager.level === 2) {
                gameManager.player.addScore(80);
            } else {
                gameManager.player.addScore(50);
            }
        }
    }

    isAlive() {     // жив ли враг
        return this.health > 0;
    }

    draw(ctx, spriteCount) {        // отрисовка врага на экране.
        if (this.move_x === 1) {
            spriteManager.drawSprite(ctx, 'Enemy', this.pos_x, this.pos_y, 64 *  spriteCount, 384);
            this.direction = 128;
            return;
        }
        if (this.move_x === -1) {
            spriteManager.drawSprite(ctx, 'Enemy', this.pos_x, this.pos_y, 64 *  spriteCount, 448);
            this.direction = 192;
            return;
        }
        if (this.move_y === -1) {
            spriteManager.drawSprite(ctx, 'Enemy', this.pos_x, this.pos_y, 64 *  spriteCount, 320);
            this.direction = 64;
            return;
        }
        if (this.move_y === 1) {
            spriteManager.drawSprite(ctx, 'Enemy', this.pos_x, this.pos_y, 64 *  spriteCount, 256);
            this.direction = 0;
            return;
        }
        spriteManager.drawSprite(ctx, 'Enemy', this.pos_x, this.pos_y, 0, this.direction);
    }
}

export class Food extends Entity {
    constructor() {
        super();
    }

    draw(ctx) { // отрисовка еды на экране
        spriteManager.drawSprite(ctx, 'Food', this.pos_x, this.pos_y);
    }
}

export class Key extends Entity {
    constructor() {
        super();
    }

    draw(ctx) {
        spriteManager.drawSprite(ctx, 'Key', this.pos_x, this.pos_y);
    }
}

export class Door extends Entity {
    constructor() {
        super();
        this.opened = false
        this.offsetX = 0
        this.offsetY = 0
    }

    draw(ctx) {
        spriteManager.drawSprite(ctx, 'Door', this.pos_x, this.pos_y, this.offsetX);
    }
}

export class Ladder extends Entity {
    constructor() {
        super();
    }

    draw(ctx) {
        if (this.visible){
            spriteManager.drawSprite(ctx, 'Ladder', this.pos_x, this.pos_y);
        }
    }
}