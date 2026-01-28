
class SoundManager {
    constructor() {
        this.clips = {};        // Хранит загруженные звуковые клипы
        this.context = null;    // Контекст звука
        this.gainNode = null;   // Узел для управления громкостью
        this.loaded = false;    // // Флаг, указывающий, загружены ли все звуки
        this.sounds = ['../sounds/key.wav', '../sounds/ladder.wav', "../sounds/lose.wav", "../sounds/win.wav", "../sounds/inecraft_hit_sound.wav", "../sounds/inecraft_chest_open.wav", "../sounds/inecraft_eating.wav", "../sounds/inecraft_damage.wav", "../sounds/hurt-1.mp3"];  // Список звуковых файлов
    }

    init() {    // Инициализация звука
        this.context = new AudioContext();
        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);
    }

    load(path, callback) {      // Загрузка звука
        if (this.clips[path]) {
            callback(this.clips[path]);
            return;
        }

        const clip = {path: path, buffer: null, loaded: false};

        clip.play =  (volume, loop) => {
            this.play(clip.path, {looping: loop ? loop : false, volume: volume ? volume : 1});
        };

        this.clips[path] = clip;

        const request = new XMLHttpRequest();
        request.open('GET', path, true);
        request.responseType = 'arraybuffer';
        request.onload = () => {
            this.context.decodeAudioData(request.response, (buffer) => {
                clip.buffer = buffer;
                clip.loaded = true;
                callback(clip);
            });
        };
        request.send();
    }

    loadArray(array) {      // Загрузка массива звуковых файлов
        for (let i = 0; i < array.length; i++) {
            this.load(array[i], () => {
                if (array.length === Object.keys(this.clips).length) {
                    for (let sd in this.clips) {
                        if (!this.clips[sd].loaded) return;
                    }
                    this.loaded = true;
                }
            });
        }

        for (const path of array) {
            this.load(path, () => {
                if (array.length === Object.keys(this.clips).length) {
                    for (const sd in this.clips) {
                        if (!this.clips[sd].loaded) return;
                    }
                    this.loaded = true;
                }
            });
        }
    }

    play(path, settings) {      // Воспроизводит звук по указанному пути 
        if (!this.loaded) {
            setTimeout(() => {
                this.play(path, settings);
            }, 1000);
            return;
        }

        let looping = false;
        let volume = 1;

        if (settings) {
            if (settings.looping) looping = settings.looping;
            if (settings.volume) volume = settings.volume;
        }

        const sd = this.clips[path];

        if (sd === null)
            return false;

        const sound = this.context.createBufferSource();
        sound.buffer = sd.buffer;
        sound.connect(this.gainNode);
        sound.loop = looping;
        this.gainNode.gain.value = volume;
        sound.start(0);
        return true;
    }
}

const soundManager = new SoundManager();
export default soundManager;
