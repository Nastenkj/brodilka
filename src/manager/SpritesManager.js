import mapManager from './MapManager.js';

class SpriteManager {
    constructor() {
        console.log('sprites')
        this.image = new Image();   // Объект изображения для атласа спрайтов
        this.sprites = [];      // Массив для хранения информации о спрайтах
        this.imgLoaded = false;     // Флаг, указывающий, что изображение загружено
        this.jsonLoaded = false;    // Флаг, указывающий, что json файл загружен
    }

    loadAtlas(atlasJson, atlasImg) {        // Метод для загрузки атласа спрайтов
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState === 4 && request.status === 200) {
                this.parseAtlas(request.responseText);
            }
        };
        request.open('GET', atlasJson, true);
        request.send();
        this.loadImg(atlasImg);
    }

    parseAtlas(atlasJSON) {     // Метод для парсинга атласа спрайтов
        const atlas = JSON.parse(atlasJSON);
        for (const name in atlas.frames) {
            const frame = atlas.frames[name].frame;
            this.sprites.push({name, x: frame.x, y: frame.y, w: frame.w, h: frame.h});
        }
        this.jsonLoaded = true;
    }

    loadImg(imgName) {      // Метод для загрузки изображения
        this.image.onload = () => {
            this.imgLoaded = true;
        };
        this.image.src = imgName;
    }

    getSprite(name) {       // Метод для получения спрайта по имени
        for (let i = 0; i < this.sprites.length; i++) {
            let s = this.sprites[i];
            if (s.name === name) {
                return s;
            }
        }
        return null;
    }

    drawRotatedSprite(ctx, name, x, y, angle) {     // Метод для рисования спрайта с вращением
        if (!(this.imgLoaded && this.jsonLoaded)) {
            setTimeout(() => this.drawRotatedSprite(ctx, name, x, y, angle), 100);
        } else {
            const sprite = this.getSprite(name);
            if (!sprite || !mapManager.isVisible(x, y, sprite.w, sprite.h)) return;
    
            x -= mapManager.view.x;
            y -= mapManager.view.y;
    
            ctx.save(); // Сохраняем текущее состояние контекста
            ctx.translate(x + sprite.w / 2, y + sprite.h / 2); // Перемещаем начало координат к центру спрайта
            ctx.rotate(angle); // Поворачиваем
            ctx.drawImage(
                this.image,
                sprite.x,
                sprite.y,
                sprite.w,
                sprite.h,
                -sprite.w / 2,
                -sprite.h / 2,
                sprite.w,
                sprite.h
            );
            ctx.restore(); // Восстанавливаем исходное состояние контекста
        }
    }
    

    drawSprite(ctx, name, x, y, offsetX = 0, offsetY = 0) {     // Метод для рисования спрайта
        if (!(this.imgLoaded && this.jsonLoaded)) {
            setTimeout(() => this.drawSprite(ctx, name, x, y), 100);
        } else {
            const sprite = this.getSprite(name);
            if (!mapManager.isVisible(x, y, sprite.w, sprite.h))
                return;
            x -= mapManager.view.x;
            y -= mapManager.view.y;

            ctx.drawImage(this.image, sprite.x + offsetX, sprite.y + offsetY, sprite.w, sprite.h, x, y, sprite.w, sprite.h);
        }
    }
}

const spriteManager = new SpriteManager();
export default spriteManager;
