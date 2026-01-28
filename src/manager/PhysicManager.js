import mapManager from "./MapManager.js";
import eventsManager from "./EventsManager.js";
import soundManager from "./SoundManager.js";
import gameManager from "./GameManager.js";

class PhysicManager {
    move(obj) {
        // Если нет движения, просто выходим
        if (obj.move_x === 0 && obj.move_y === 0)
            return "stop";
    
        // Рассчитываем новые координаты на основе движения
        let newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
        let newY = obj.pos_y + Math.floor(obj.move_y * obj.speed);
    
        let tsX = mapManager.getAvailableInfo(newX + obj.size_x / 2, obj.pos_y + obj.size_y / 2); // Проверка по оси X
        let tsY = mapManager.getAvailableInfo(obj.pos_x + obj.size_x / 2, newY + obj.size_y / 2); // Проверка по оси Y
    
        // Если столкновение по оси X, блокируем движение по X, но сохраняем движение по Y
        if (tsX === 0) {
            obj.move_x = 0;  // Блокируем движение по оси X
        }
    
        // Если столкновение по оси Y, блокируем движение по Y, но сохраняем движение по X
        if (tsY === 0) {
            obj.move_y = 0;  // Блокируем движение по оси Y
        }
    
        // Если движение не блокируется, продолжаем движение
        if (obj.move_x !== 0 || obj.move_y !== 0) {
            return "move";
        } else {
            return "break"; // Если движение полностью заблокировано
        }
    }
    

    playerDirection(player, enemies) {      // Управление движением игрока
        if (eventsManager.action["up"]) {
            player.move_y = -1;
        }
        if (eventsManager.action["down"]) {
            player.move_y = 1;
        }
        if (eventsManager.action["left"]) {
            player.move_x = -1;
        }
        if (eventsManager.action["right"]) {
            player.move_x = 1;
        }
        if (eventsManager.action['attack'] && player.canAttack()) {     // управление атакой игрока
            physicManager.areaDamage(player, enemies, player.attackRadius); // Используем радиус игрока
            soundManager.play('../sounds/inecraft_hit_sound.wav')
            eventsManager.action['attack'] = false;
        }
    }
    
    areaDamage(player, enemies, radius) {   // Атака игрока по радиусу
        enemies.forEach(enemy => {      // // Вычисляем расстояние между игроком и врагом
            const dx = player.pos_x - enemy.pos_x;
            const dy = player.pos_y - enemy.pos_y;
            const distance = Math.sqrt(dx * dx + dy * dy);
    
            if (distance <= radius) {       // Если враг в радиусе атаки, наносим урон
                // Вызов метода получения урона
                if (enemy.takeDamage) {
                    enemy.takeDamage(); // Наносим 1 единицу урона
                    console.log('Enemy damaged!');
                    soundManager.play('../sounds/hurt-1.mp3')
                }
            }
        });
    }

    enemyDirection(player, entity) {        // Вычисляем разницу в координатах между игроком и врагом
        const dx = player.pos_x - entity.pos_x;
        const dy = player.pos_y - entity.pos_y;
    
        // Простейший алгоритм для избегания препятствий
        const newX = entity.pos_x + Math.floor(entity.move_x * entity.speed);
        const newY = entity.pos_y + Math.floor(entity.move_y * entity.speed);
        
        // Проверка на препятствия по осям X и Y
        let tsX = mapManager.getAvailableInfo(newX + entity.size_x / 2, entity.pos_y + entity.size_y / 2);
        let tsY = mapManager.getAvailableInfo(entity.pos_x + entity.size_x / 2, newY + entity.size_y / 2);
    
        // Если есть препятствие, двигаемся в другую сторону (влево/вправо)
        if (tsX === 0) {
            // Если по X есть стена, пытаемся двигаться влево или вправо
            if (dx > 0) {
                entity.move_x = -1; // Двигаемся влево
            } else {
                entity.move_x = 1;  // Двигаемся вправо
            }
        }
        
        if (tsY === 0) {
            // Если по Y есть стена, пытаемся двигаться вверх или вниз
            if (dy > 0) {
                entity.move_y = -1; // Двигаемся вверх
            } else {
                entity.move_y = 1;  // Двигаемся вниз
            }
        }
    
        // Если нет препятствий, двигаемся в сторону игрока
        if (Math.abs(dx) > Math.abs(dy)) {
            // Движение по оси X
            entity.move_x = dx > 0 ? 1 : -1;
        } else {
            // Движение по оси Y
            entity.move_y = dy > 0 ? 1 : -1;
        }
    }

    moveRandomly(entity) {
        // Проверяем, движется ли враг и не заблокировано ли движение
        if (entity.move_x === 0 && entity.move_y === 0) {
            // Если враг остановился, задаем новое случайное направление
            const randomDirection = Math.floor(Math.random() * 4);
            switch (randomDirection) {
                case 0: // Двигаться вверх
                    entity.move_x = 0;
                    entity.move_y = -1;
                    break;
                case 1: // Двигаться вниз
                    entity.move_x = 0;
                    entity.move_y = 1;
                    break;
                case 2: // Двигаться влево
                    entity.move_x = -1;
                    entity.move_y = 0;
                    break;
                case 3: // Двигаться вправо
                    entity.move_x = 1;
                    entity.move_y = 0;
                    break;
            }
        }
    
        // Проверяем, не столкнулся ли враг со стеной
        const result = this.move(entity);
        if (result === "break") {
            // Если столкнулся со стеной, останавливаем и сбрасываем направление
            entity.move_x = 0;
            entity.move_y = 0;
        }
    }
    
    
    clearDirection(obj) {       // Останавливает движение объекта, сбрасывая его скорость по осям X и Y
        obj.move_x = 0;
        obj.move_y = 0;
    }

    inActiveSpace(player, entity) {     // Проверяем, находится ли враг в активной зоне игрока
        if (
            ((player.pos_x - entity.pos_x) > -340 &&
                (player.pos_x - entity.pos_x) < 260)
            &&
            ((player.pos_y - entity.pos_y) < 280 &&
                -340 < (player.pos_y - entity.pos_y))
        ) {
            return 1
        }
        return 0
    }

    getDamage(player, entity) {     // Вычисляем урон, наносимый игроку врагом
        if (
            ((player.pos_x - entity.pos_x) > -20 &&
                (player.pos_x - entity.pos_x) < 10) &&
            ((player.pos_y - entity.pos_y) < 10 &&
                -20 < (player.pos_y - entity.pos_y))
        ) {
            let cur_date = new Date().getTime();
            
            let damageTimeout = gameManager.level === 2 ? 1000 : 2000;
            
            if (player && player.life && cur_date - player.timeOut > damageTimeout) {
                soundManager.play('../sounds/inecraft_damage.wav');
                player.life -= 1;
                player.timeOut = cur_date;
                console.log('current hp: ', player.life);
            }
            return player.life;
        }
        return true;
    }

    getFood(obj) {      // Увеличивает скорость, счет и жизнь игрока при получении еды
        if (obj && obj.life) {
            soundManager.play('../sounds/inecraft_eating.wav')
            if (gameManager.level === 2) {
                obj.speed += 1
                obj.score += 20
                obj.life += 1
                obj.attackCooldown -= 50
            } else {
                obj.speed += 1
                obj.score += 20
                obj.attackCooldown -= 50
            }
        }
    }

    openDoor (obj) {        // Открывает дверь
        obj.opened = true
        obj.offsetX = 128
        soundManager.play('../sounds/inecraft_chest_open.wav')
        console.log('Door opened')
    }

    isClose(player, entity) {       // Проверяет, находится ли игрок рядом с дверью
        if (
            ((player.pos_x - entity.pos_x) > -50 &&
                (player.pos_x - entity.pos_x) < 10)
            &&
            ((player.pos_y - entity.pos_y) < 20 &&
                -50 < (player.pos_y - entity.pos_y))
        ) {
            return 1
        }
        return 0
    }


}

const physicManager = new PhysicManager();
export default physicManager;